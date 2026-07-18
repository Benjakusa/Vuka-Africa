/**
 * M-Pesa Integration Test Script
 *
 * Usage:
 *   1. Set up your .env with sandbox credentials
 *   2. Run: npx tsx scripts/test-mpesa.ts
 *
 * This script tests:
 *   - OAuth token generation and caching
 *   - STK Push initiation (to sandbox test phone)
 *   - B2C Payment initiation
 *   - Transaction status query
 *
 * For sandbox testing:
 *   - STK Push: Use Safaricom's test phone 254708374149
 *   - Callbacks: Use ngrok to expose localhost (ngrok http 3000)
 *   - Then set MPESA_CALLBACK_URL to your ngrok URL + /api/v1/webhooks/mpesa/confirmation
 *   - Simulate callbacks via Safaricom Developer Portal → Simulate C2B
 */

import { mpesaClient } from '../lib/mpesa';
import { redis } from '../lib/redis';

const TEST_PHONE = '254708374149';
const TEST_AMOUNT = 10;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAccessToken() {
  console.log('\n=== Test: Access Token Generation ===');
  const token = await mpesaClient.getAccessToken();
  console.log(`Access token: ${token.slice(0, 20)}...${token.slice(-10)}`);

  const cached = await redis.get('mpesa:access_token');
  console.log(`Cached in Redis: ${!!cached}`);

  if (token === cached) {
    console.log('✓ Token caching works correctly');
  } else {
    console.log('✗ Token caching mismatch');
  }
}

async function testStkPush() {
  console.log('\n=== Test: STK Push ===');
  try {
    const response = await mpesaClient.stkPush({
      phone: TEST_PHONE,
      amount: TEST_AMOUNT,
      accountReference: `TEST-${Date.now().toString(36)}`,
      transactionDesc: 'Vuka Afrique Test Payment',
    });

    console.log(`MerchantRequestID: ${response.MerchantRequestID}`);
    console.log(`CheckoutRequestID: ${response.CheckoutRequestID}`);
    console.log(`ResponseCode: ${response.ResponseCode}`);
    console.log(`ResponseDescription: ${response.ResponseDescription}`);

    if (response.ResponseCode === '0') {
      console.log('✓ STK Push initiated successfully');
      console.log('  Check the test phone for M-Pesa prompt');
    } else {
      console.log(`! STK Push returned code ${response.ResponseCode}: ${response.ResponseDescription}`);
    }

    return response;
  } catch (error: any) {
    console.error('✗ STK Push failed:', error.message);
    if (error.responseData) {
      console.error('  API response:', JSON.stringify(error.responseData, null, 2));
    }
    return null;
  }
}

async function testB2C() {
  console.log('\n=== Test: B2C Payment ===');
  try {
    const response = await mpesaClient.b2cPayment({
      amount: TEST_AMOUNT,
      phone: TEST_PHONE,
      remarks: 'Vuka Afrique test payout',
      idempotencyKey: `test-${Date.now()}`,
    });

    console.log(`ConversationID: ${response.ConversationID}`);
    console.log(`OriginatorConversationID: ${response.OriginatorConversationID}`);
    console.log(`ResponseCode: ${response.ResponseCode}`);

    if (response.ResponseCode === '0') {
      console.log('✓ B2C Payment accepted');
    } else {
      console.log(`! B2C returned code ${response.ResponseCode}`);
    }

    return response;
  } catch (error: any) {
    console.error('✗ B2C Payment failed:', error.message);
    return null;
  }
}

async function testTransactionStatus(transactionId: string) {
  console.log('\n=== Test: Transaction Status ===');
  try {
    const response = await mpesaClient.transactionStatus(transactionId);
    console.log(`ResponseCode: ${response.ResponseCode}`);
    console.log(`ResultDesc: ${response.ResultDesc}`);
    console.log(`TransactionID: ${response.TransactionID}`);

    if (response.ResponseCode === '0') {
      console.log('✓ Transaction status queried successfully');
    }

    return response;
  } catch (error: any) {
    console.error('✗ Transaction status query failed:', error.message);
    return null;
  }
}

async function testAccountBalance() {
  console.log('\n=== Test: Account Balance ===');
  try {
    const response = await mpesaClient.accountBalance();
    console.log(`ResponseCode: ${response.ResponseCode}`);
    console.log(`ResultDesc: ${response.ResultDesc}`);
    return response;
  } catch (error: any) {
    console.error('✗ Account balance query failed:', error.message);
    return null;
  }
}

async function testIPValidation() {
  console.log('\n=== Test: IP Validation ===');
  const validIp = '196.201.214.200';
  const invalidIp = '1.2.3.4';

  const validResult = mpesaClient.validateCallbackIp(validIp);
  const invalidResult = mpesaClient.validateCallbackIp(invalidIp);

  if (invalidResult === false) {
    console.log(`✓ Correctly rejected unauthorized IP: ${invalidIp}`);
  }
  console.log(`Valid IP (${validIp}) allowed in sandbox: ${validResult}`);

  console.log('Note: In sandbox mode, all IPs are allowed');
  console.log('      In production, only Safaricom IPs are allowed');
}

async function testHMACValidation() {
  console.log('\n=== Test: HMAC Signature Validation ===');
  const testBody = JSON.stringify({ test: 'data' });
  const { createHmac } = await import('crypto');

  const validSig = createHmac('sha256', process.env.MPESA_PASSKEY || 'test')
    .update(testBody)
    .digest('base64');

  const invalidSig = 'invalid-signature';

  const validResult = mpesaClient.validateCallbackSignature(testBody, validSig);
  const invalidResult = mpesaClient.validateCallbackSignature(testBody, invalidSig);

  if (invalidResult === false) {
    console.log('✓ Correctly rejected invalid signature');
  }
  console.log(`Valid signature check: ${validResult}`);
  console.log('Note: In sandbox mode, signature validation is skipped');
}

async function main() {
  console.log('========================================');
  console.log('  M-Pesa Integration Test Suite');
  console.log(`  Environment: ${process.env.MPESA_ENV || 'sandbox'}`);
  console.log('========================================');

  await testAccessToken();
  await sleep(1000);

  await testIPValidation();
  await sleep(500);

  await testHMACValidation();
  await sleep(500);

  const stkResult = await testStkPush();
  await sleep(1000);

  const b2cResult = await testB2C();
  await sleep(1000);

  if (stkResult?.CheckoutRequestID) {
    await sleep(2000);
    console.log('\nNote: Transaction status query requires the transaction');
    console.log('      to be processed first. Use the M-Pesa sandbox');
    console.log('      simulator to send callbacks to your ngrok URL.');
  }

  await redis.quit();
  console.log('\n=== Tests Complete ===');
}

main().catch(console.error);
