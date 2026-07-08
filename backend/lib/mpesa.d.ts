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
export declare class MpesaError extends Error {
    apiCode?: string | undefined;
    responseData?: any | undefined;
    constructor(message: string, apiCode?: string | undefined, responseData?: any | undefined);
}
export declare class MpesaClient {
    private baseUrl;
    private http;
    private shortcode;
    private b2cShortcode;
    private passkey;
    private consumerKey;
    private consumerSecret;
    private b2cInitiatorName;
    private b2cSecurityCredential;
    private callbackUrl;
    private b2cResultUrl;
    private b2cTimeoutUrl;
    private isSandbox;
    constructor();
    getAccessToken(): Promise<string>;
    private getTimestamp;
    private generateStkPassword;
    private formatPhone;
    stkPush(request: StkPushRequest): Promise<StkPushResponse>;
    b2cPayment(request: B2CRequest): Promise<B2CResponse>;
    transactionStatus(transactionId: string, partyA?: string): Promise<TransactionStatusResponse>;
    accountBalance(): Promise<AccountBalanceResponse>;
    validateCallbackIp(ip: string, forwardedFor?: string): boolean;
    validateCallbackSignature(body: string, signatureHeader: string): boolean;
    parseStkCallback(body: any): StkCallbackData | null;
    parseB2cCallback(body: any): B2CCallbackData | null;
    sanitizeRequestData(data: any): any;
}
export declare const mpesaClient: MpesaClient;
