import axios, { AxiosInstance } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from './env';
import { redis } from './redis';
import { maskPhone } from './encryption';
import { MPESA, CACHE } from './config';

const SAFARICOM_IPS = env.MPESA_IP_WHITELIST.split(',').map(ip => ip.trim());

export interface StkPushRequest {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface B2CRequest {
  amount: number;
  phone: string;
  remarks: string;
  occasion?: string;
  idempotencyKey: string;
}

export interface B2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription?: string;
}

export interface TransactionStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  ResultCode?: string;
  ResultDesc?: string;
  TransactionID?: string;
  TransactionDate?: string;
  Amount?: string;
  ReceiverPartyPublicName?: string;
}

export interface AccountBalanceResponse {
  ResponseCode: string;
  ResponseDescription: string;
  ResultCode?: string;
  ResultDesc?: string;
  Balance?: string;
}

export interface StkCallbackData {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
  transactionDate?: string;
  accountReference?: string;
  rawCallback: any;
}

export interface B2CCallbackData {
  resultCode: number;
  resultDesc: string;
  originatorConversationId: string;
  conversationId: string;
  transactionId: string;
  receiverPartyPublicName?: string;
  transactionAmount?: string;
  transactionDate?: string;
  rawCallback: any;
}

export class MpesaError extends Error {
  constructor(
    message: string,
    public apiCode?: string,
    public responseData?: any,
  ) {
    super(message);
    this.name = 'MpesaError';
  }
}

export class MpesaClient {
  private baseUrl: string;
  private http: AxiosInstance;
  private shortcode: string;
  private b2cShortcode: string;
  private passkey: string;
  private consumerKey: string;
  private consumerSecret: string;
  private b2cInitiatorName: string;
  private b2cSecurityCredential: string;
  private callbackUrl: string;
  private b2cResultUrl: string;
  private b2cTimeoutUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.isSandbox = env.MPESA_ENV === 'sandbox';
    this.baseUrl = this.isSandbox ? MPESA.SANDBOX_BASE : MPESA.PROD_BASE;
    this.shortcode = env.MPESA_SHORTCODE;
    this.b2cShortcode = env.MPESA_B2C_SHORTCODE;
    this.passkey = env.MPESA_PASSKEY;
    this.consumerKey = env.MPESA_CONSUMER_KEY;
    this.consumerSecret = env.MPESA_CONSUMER_SECRET;
    this.b2cInitiatorName = env.MPESA_B2C_INITIATOR_NAME;
    this.b2cSecurityCredential = env.MPESA_B2C_SECURITY_CREDENTIAL;
    this.callbackUrl = env.MPESA_CALLBACK_URL || `${env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/mpesa/confirmation`;
    this.b2cResultUrl = env.MPESA_B2C_RESULT_URL || `${env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/mpesa/b2c-result`;
    this.b2cTimeoutUrl = env.MPESA_B2C_TIMEOUT_URL || `${env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/mpesa/b2c-timeout`;

    this.http = axios.create({
      timeout: MPESA.TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.response.use(
      (response) => {
        const sanitized = this.sanitizeRequestData(response.config.data);
        console.log(`[M-Pesa] ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`, sanitized);
        return response;
      },
      (error) => {
        const sanitized = this.sanitizeRequestData(error.config?.data);
        console.error(`[M-Pesa] ERROR ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message, sanitized);
        return Promise.reject(error);
      }
    );
  }

  async getAccessToken(): Promise<string> {
    const cacheKey = 'mpesa:access_token';
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    try {
      const response = await this.http.post(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        null,
        { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
      );

      const token = response.data.access_token;
      const expiresIn = (response.data.expires_in || 3599) - CACHE.MPESA_TOKEN_TTL_BUFFER;

      await redis.setex(cacheKey, expiresIn, token);
      return token;
    } catch (error: any) {
      throw new MpesaError(
        'Failed to get M-Pesa access token',
        error.response?.data?.errorCode || error.code,
        error.response?.data
      );
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private generateStkPassword(timestamp: string): string {
    const str = this.shortcode + this.passkey + timestamp;
    return Buffer.from(str).toString('base64');
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
    if (cleaned.startsWith('254')) return cleaned;
    return '254' + cleaned;
  }

  async stkPush(request: StkPushRequest): Promise<StkPushResponse> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generateStkPassword(timestamp);
    const phone = this.formatPhone(request.phone);

    const body = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(request.amount),
      PartyA: phone,
      PartyB: this.shortcode,
      PhoneNumber: phone,
      CallBackURL: this.callbackUrl,
      AccountReference: request.accountReference.slice(0, 12),
      TransactionDesc: request.transactionDesc.slice(0, 13),
    };

    try {
      const response = await this.http.post(
        `${this.baseUrl}/mpesa/stkpush/v3/simulate`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        MerchantRequestID: response.data.MerchantRequestID,
        CheckoutRequestID: response.data.CheckoutRequestID,
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription,
        CustomerMessage: response.data.CustomerMessage,
      };
    } catch (error: any) {
      const desc = error.response?.data?.errorMessage || error.message;
      throw new MpesaError(
        `STK Push failed: ${desc}`,
        error.response?.data?.errorCode,
        error.response?.data
      );
    }
  }

  async b2cPayment(request: B2CRequest): Promise<B2CResponse> {
    const token = await this.getAccessToken();
    const phone = this.formatPhone(request.phone);

    const body = {
      InitiatorName: this.b2cInitiatorName,
      SecurityCredential: this.b2cSecurityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.round(request.amount),
      PartyA: this.b2cShortcode,
      PartyB: phone,
      Remarks: request.remarks.slice(0, 100),
      QueueTimeOutURL: this.b2cTimeoutUrl,
      ResultURL: this.b2cResultUrl,
      Occasion: (request.occasion || request.idempotencyKey).slice(0, 100),
    };

    try {
      const response = await this.http.post(
        `${this.baseUrl}/mpesa/b2c/v3/paymentrequest`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        ConversationID: response.data.ConversationID,
        OriginatorConversationID: response.data.OriginatorConversationID,
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription,
      };
    } catch (error: any) {
      const desc = error.response?.data?.errorMessage || error.message;
      throw new MpesaError(
        `B2C Payment failed: ${desc}`,
        error.response?.data?.errorCode,
        error.response?.data
      );
    }
  }

  async transactionStatus(
    transactionId: string,
    partyA?: string
  ): Promise<TransactionStatusResponse> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generateStkPassword(timestamp);

    const body = {
      Initiator: this.b2cInitiatorName,
      SecurityCredential: this.b2cSecurityCredential,
      CommandID: 'TransactionStatusQuery',
      TransactionID: transactionId,
      PartyA: partyA || this.shortcode,
      IdentifierType: '4',
      ResultURL: this.b2cResultUrl.replace('/b2c-result', '/transaction-status'),
      QueueTimeOutURL: this.b2cTimeoutUrl.replace('/b2c-timeout', '/transaction-status-timeout'),
      Remarks: 'TransactionStatusQuery',
      Occasion: 'Vuka Reconciliation',
    };

    try {
      const response = await this.http.post(
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      throw new MpesaError(
        `Transaction status query failed: ${error.message}`,
        error.response?.data?.errorCode,
        error.response?.data
      );
    }
  }

  async accountBalance(): Promise<AccountBalanceResponse> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const securityCredential = this.b2cSecurityCredential;

    const body = {
      Initiator: this.b2cInitiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'AccountBalance',
      PartyA: this.shortcode,
      IdentifierType: '4',
      ResultURL: this.b2cResultUrl.replace('/b2c-result', '/account-balance'),
      QueueTimeOutURL: this.b2cTimeoutUrl.replace('/b2c-timeout', '/account-balance-timeout'),
      Remarks: 'AccountBalanceQuery',
    };

    try {
      const response = await this.http.post(
        `${this.baseUrl}/mpesa/accountbalance/v1/query`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      throw new MpesaError(
        `Account balance query failed: ${error.message}`,
        error.response?.data?.errorCode,
        error.response?.data
      );
    }
  }

  validateCallbackIp(ip: string, forwardedFor?: string): boolean {
    if (this.isSandbox) return true;
    const checkIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ip;
    return SAFARICOM_IPS.includes(checkIp);
  }

  validateCallbackSignature(body: string, signatureHeader: string): boolean {
    if (this.isSandbox) return true;

    try {
      const expected = createHmac('sha256', this.passkey)
        .update(body)
        .digest('base64');

      const expectedBuf = Buffer.from(expected);
      const providedBuf = Buffer.from(signatureHeader);

      if (expectedBuf.length !== providedBuf.length) return false;
      return timingSafeEqual(expectedBuf, providedBuf);
    } catch {
      return false;
    }
  }

  parseStkCallback(body: any): StkCallbackData | null {
    try {
      const stk = body?.Body?.stkCallback;
      if (!stk) return null;

      const metadata: Record<string, string> = {};
      if (stk.CallbackMetadata?.Item) {
        for (const item of stk.CallbackMetadata.Item) {
          metadata[item.Name] = item.Value || item.ValueWithType || '';
        }
      }

      return {
        merchantRequestId: stk.MerchantRequestID,
        checkoutRequestId: stk.CheckoutRequestID,
        resultCode: stk.ResultCode,
        resultDesc: stk.ResultDesc,
        amount: metadata.Amount ? Number(metadata.Amount) : undefined,
        mpesaReceiptNumber: metadata.MpesaReceiptNumber,
        phoneNumber: metadata.PhoneNumber,
        transactionDate: metadata.TransactionDate,
        accountReference: metadata.AccountReference,
        rawCallback: body,
      };
    } catch {
      return null;
    }
  }

  parseB2cCallback(body: any): B2CCallbackData | null {
    try {
      const result = body?.Result;
      if (!result) return null;

      const params: Record<string, string> = {};
      if (result.ResultParameters?.ResultParameter) {
        for (const param of result.ResultParameters.ResultParameter) {
          params[param.Key] = param.Value || '';
        }
      }

      return {
        resultCode: result.ResultCode,
        resultDesc: result.ResultDesc,
        originatorConversationId: result.OriginatorConversationID,
        conversationId: result.ConversationID,
        transactionId: result.TransactionID,
        receiverPartyPublicName: params.ReceiverPartyPublicName,
        transactionAmount: params.TransactionAmount,
        transactionDate: params.TransactionDate,
        rawCallback: body,
      };
    } catch {
      return null;
    }
  }

  sanitizeRequestData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sanitized = { ...data };
    if (sanitized.PhoneNumber) sanitized.PhoneNumber = maskPhone(String(sanitized.PhoneNumber));
    if (sanitized.PartyA) sanitized.PartyA = maskPhone(String(sanitized.PartyA));
    if (sanitized.PartyB) sanitized.PartyB = maskPhone(String(sanitized.PartyB));
    if (sanitized.Password) sanitized.Password = '***';
    if (sanitized.SecurityCredential) sanitized.SecurityCredential = '***';
    return sanitized;
  }
}

export const mpesaClient = new MpesaClient();
