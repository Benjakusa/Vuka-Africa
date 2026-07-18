# Vuka — Background Job Queue Specifications

**Infrastructure:** BullMQ over Redis (Upstash). Worker processes run in the same Node.js process for the MVP (via `Worker` from BullMQ). For future extraction, move to separate worker processes.

**Common job options:**

- `removeOnComplete: { age: 3600 * 24 * 7 }` — keep for 7 days
- `removeOnFail: { age: 3600 * 24 * 30 }` — keep for 30 days

---

## Queue: `mpesa-callbacks`

Processes incoming M-Pesa callback data.

### Job Type: `process-stk-callback`

| Field        | Description                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Payload**  | `{ mpesaTransactionId: string, merchantRequestId: string, resultCode: number, resultDesc: string, amount: number, phoneNumber: string, referenceType: "enrolment" | "verification", referenceId: string, rawCallback: object }` |
| **Attempts** | 3                                                                                                                                                                 |
| **Backoff**  | Exponential (30s, 60s, 120s)                                                                                                                                      |

**Handler logic:**

```
1. Idempotency check
   - Look up TransactionLedger by mpesaTransactionId
   - If exists -> return (already processed)

2. Validate success
   - resultCode !== 0 -> mark reference as failed, notify user, return

3. Route by referenceType

   CASE "enrolment":
     a. Fetch Enrolment (must be PENDING_PAYMENT)
     b. Validate amount matches enrolment.pricePaidKes
     c. Update Enrolment:
        - status = ACTIVE
        - mpesaTransactionId = mpesaTransactionId
        - startedAt = now()
     d. Create 3 Milestones:
        - seq 1: 25%, label "Deposit",   amount = enrolment.pricePaidKes * 0.25
        - seq 2: 50%, label "Progress",  amount = enrolment.pricePaidKes * 0.50
        - seq 3: 25%, label "Completion", amount = enrolment.pricePaidKes * 0.25
     e. Insert TransactionLedger:
        - type: TRAINEE_PAYMENT, direction: CREDIT
        - amount: enrolment.pricePaidKes
        - referenceType: "enrolment", referenceId: enrolment.id
     f. Enqueue email job: "Payment received — you're enrolled!"
     g. Enqueue email to trainer: "New student enrolled!"

   CASE "verification":
     a. Fetch Trainer
     b. Update:
        - verificationFeePaid = true
        - verificationStatus = PENDING (if UNSUBMITTED)
     c. Insert TransactionLedger:
        - type: VERIFICATION_FEE, direction: DEBIT
        - amount: 5000
     d. Enqueue email job: "Verification fee received — under review"
```

### Job Type: `process-b2c-result`

| Field        | Description                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Payload**  | `{ payoutId: string, resultCode: number, resultDesc: string, mpesaTransactionId: string, mpesaReceiptNumber: string, rawCallback: object }` |
| **Attempts** | 1 (payouts queue manages retries)                                                                                                           |

**Handler logic:**

```
1. Fetch Payout (must be PROCESSING)
2. If resultCode === 0:
   - Update Payout: status = COMPLETED, mpesaReceiptNumber = ..., completedAt = now()
   - Insert TransactionLedger: type = TRAINER_PAYOUT, direction = DEBIT
   - Enqueue email: "Payout of KES X sent to your M-Pesa"
3. Else:
   - Update Payout: status = FAILED, failureReason = resultDesc
   - Refund trainer available_balance (via TransactionLedger: REFUND, CREDIT)
   - Enqueue email: "Payout failed — funds returned to your wallet"
```

---

## Queue: `milestone-release`

Handles the 24-hour delay between trainee confirmation and actual fund release.

### Job Type: `release-milestone`

| Field        | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| **Payload**  | `{ milestoneId: string, enrolmentId: string, trainerId: string, amountKes: number }` |
| **Delay**    | 86400000ms (24 hours) — set at enqueue time                                          |
| **Attempts** | 3                                                                                    |
| **Backoff**  | Fixed 30s                                                                            |

**Handler logic:**

```
1. Fetch Milestone (must be TRAINEE_CONFIRMED)
   - If not -> job is stale (trainee disputed or admin overrode), return
2. BEGIN TRANSACTION
   a. Update Milestone:
      - status = RELEASED
      - releasedAt = now()
   b. Update Trainer:
      - availableBalance += milestone.amountKes
   c. Insert TransactionLedger:
      - type: TRAINER_PAYMENT (or COMMISSION split — see note)
      - direction: CREDIT
      - amount: milestone.amountKes
      - referenceType: "milestone", referenceId: milestone.id
   d. Increment Enrolment.currentMilestone
3. COMMIT
4. Check if all 3 milestones released -> update Enrolment.status = COMPLETED
5. Enqueue email to trainer: "Milestone X released — KES Y added to balance"
6. Enqueue email to trainee: "Milestone X confirmed and released"
```

> **Commission note:** The commission is deducted at enrolment time. The milestone amounts represent the trainer's net payout (pricePaidKes - commissionKes) × milestone percentage. The ledger entry `TRAINER_PAYMENT` is a separate entry from the `COMMISSION` entry created at enrolment.

---

## Queue: `payouts`

Handles the actual B2C M-Pesa disbursement to trainers.

### Job Type: `process-payout`

| Field        | Description                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| **Payload**  | `{ payoutId: string, trainerId: string, amountKes: number, phoneNumber: string, idempotencyKey: string }` |
| **Attempts** | 3                                                                                                         |
| **Backoff**  | Fixed 30s                                                                                                 |

**Handler logic:**

```
1. Idempotency check
   - If Payout already COMPLETED or FAILED -> return

2. Atomic balance verification
   - Fetch Trainer.availableBalance
   - If amountKes > availableBalance -> fail job permanently (insufficient funds)
   - This is a safety check; the API handler should have already deducted

3. Call M-Pesa B2C API
   POST /mpesa/b2c
   { InitiatorName, SecurityCredential, CommandID: "BusinessPayment",
     Amount: amountKes, PartyA: MPESA_B2C_SHORTCODE,
     PartyB: phoneNumber (without +254 -> 0...),
     Remarks: "Vuka payout", Occasion: "",
     ResultURL: "/api/webhooks/mpesa/b2c-result",
     QueueTimeOutURL: "/api/webhooks/mpesa/b2c-timeout" }

4. Update Payout:
   - status = PROCESSING
   - mpesaTransactionId from response

5. The B2C result arrives via webhook -> process-b2c-result job

6. On failure (network error, timeout):
   - Retry (up to 3 attempts)
   - On 3rd failure:
     a. Update Payout: status = FAILED, failureReason = "Exceeded retries"
     b. Insert TransactionLedger: type = REFUND, direction = CREDIT
     c. Refund Trainer.availableBalance
     d. Enqueue email: "Payout failed after 3 attempts — funds returned"
```

---

## Queue: `emails`

Transactional email delivery queue.

### Job Type: `send-email`

| Field        | Description                                                             |
| ------------ | ----------------------------------------------------------------------- |
| **Payload**  | `{ notificationId: string, to: string, subject: string, html: string }` |
| **Attempts** | 2                                                                       |
| **Backoff**  | Fixed 60s                                                               |

**Handler logic:**

```
1. Fetch Notification (must be QUEUED)
2. Send via Nodemailer (SMTP/SendGrid)
   const info = await transporter.sendMail({
     from: EMAIL_FROM,
     to,
     subject,
     html,
   });
3. Update Notification:
   - status = SENT
   - sentAt = now()
   - meta = { messageId: info.messageId }
4. On failure:
   - Update Notification.status = FAILED
   - meta = { error: error.message }
   - If attempt < 2 -> retry
```

---

## Queue: `reconciliation`

### Recurring Job (cron: `0 2 * * *` — daily at 2:00 AM)

```
1. Fetch M-Pesa transaction statements (via Daraja API or uploaded CSV)
2. For each M-Pesa transaction:
   a. Look up mpesaTransactionId in TransactionLedger
   b. If found -> matched
   c. If not found -> log as "unmatched_mpesa_entry"
3. For each ledger entry with mpesaTransactionId:
   a. Look up in M-Pesa statement
   b. If not found -> log as "missing_mpesa_entry"
4. Enqueue notification to admin if discrepancies > 0
```

---

## Queue: `session-reminders`

### Recurring Job (cron: `0 * * * *` — hourly)

```
1. Find all SessionLog records where sessionDate is tomorrow
2. Group by enrolmentId
3. For each:
   - Enqueue email to trainee: "Reminder: session tomorrow at [time]"
   - Enqueue email to trainer: "Reminder: session with [trainee] tomorrow"
```

---

## Queue: `cleanup`

### Recurring Job (cron: `0 3 * * 0` — weekly on Sunday 3:00 AM)

**Tasks:**

1. **Cancel stale PENDING_PAYMENT enrolments**
   - WHERE status = PENDING_PAYMENT AND createdAt < now() - interval '30 minutes'
   - Set status = CANCELLED
   - Enqueue email notification

2. **Escalate unconfirmed milestones**
   - WHERE status = TRAINER_CONFIRMED AND trainerConfirmedAt < now() - interval '72 hours'
   - Enqueue escalation notification to admin
   - (Trainee has 72h to confirm; after that, admin auto-releases or disputes)

---

## Queue Summary

| Queue Name          | Job Types                                    | Concurrency | Priority |
| ------------------- | -------------------------------------------- | ----------- | -------- |
| `mpesa-callbacks`   | `process-stk-callback`, `process-b2c-result` | 5           | High     |
| `milestone-release` | `release-milestone`                          | 10          | Normal   |
| `payouts`           | `process-payout`                             | 3           | High     |
| `emails`            | `send-email`                                 | 20          | Low      |
| `reconciliation`    | (cron)                                       | 1           | Low      |
| `session-reminders` | (cron)                                       | 2           | Low      |
| `cleanup`           | (cron)                                       | 1           | Low      |

**MVP note:** All workers run in the Next.js server process using BullMQ's `Worker`. When extracting to a separate service, workers will run in a dedicated Node.js process with `tsx` or compiled JS.
