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
export {};
