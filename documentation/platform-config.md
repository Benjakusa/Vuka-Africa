# Vuka — Platform Configuration & "First 100 Free" Logic

## Table: `PlatformConfig`

```prisma
model PlatformConfig {
  id              Int  @id @default(1)
  trainerCount    Int  @default(0)
  freeTrainerLimit Int @default(100)
}
```

This is a single-row table (id=1 always). It holds the global platform configuration for the "First 100 Free" promotion.

---

## "First 100 Free" — Business Rules

The first 100 trainers who apply on Vuka receive:

- **0% commission** on all enrolments (vs standard 20%)
- **Free verification badge** (KES 5,000 waived)
- **Lifetime** grandfathered status — the 0% commission and free verification persist forever, even if they later delete and re-create their profile

---

## Implementation: `POST /api/v1/trainers/apply`

### Pseudocode

```typescript
async function applyForTrainer(userId: string, input: ApplyInput): Promise<Trainer> {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Lock the PlatformConfig row for update (prevents race conditions)
      const config = await tx.platformConfig.findUniqueOrThrow({
        where: { id: 1 },
      });

      // 2. User must be a TRAINEE (not already a trainer)
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.role !== 'TRAINEE') {
        throw new ConflictError('User is already a trainer or admin');
      }

      // 3. Check if free spots remain
      const isFoundingTrainer = config.trainerCount < config.freeTrainerLimit;

      // 4. Create the trainer record
      const trainer = await tx.trainer.create({
        data: {
          userId,
          bio: input.bio,
          skills: input.skills,
          idDocumentUrl: input.idDocumentUrl,
          // Founding trainer benefits
          ...(isFoundingTrainer
            ? {
                isVerified: true,
                verificationStatus: 'APPROVED' as const,
                verificationFeePaid: false, // waived
                commissionRate: 0.0, // 0% forever
              }
            : {
                isVerified: false,
                verificationStatus: 'UNSUBMITTED' as const,
                commissionRate: 20.0, // standard
              }),
        },
      });

      // 5. Increment trainerCount ONLY if founding trainer was created
      if (isFoundingTrainer) {
        await tx.platformConfig.update({
          where: { id: 1 },
          data: { trainerCount: { increment: 1 } },
        });
      }

      // 6. Update user role to TRAINER
      await tx.user.update({
        where: { id: userId },
        data: { role: 'TRAINER' },
      });

      // 7. Enqueue welcome email (different template based on founding status)
      await enqueueEmail({
        userId,
        subject: isFoundingTrainer
          ? '🎉 Welcome Founding Trainer — 0% Commission for Life!'
          : 'Welcome to Vuka — Complete Your Profile',
        template: isFoundingTrainer ? 'founding-trainer-welcome' : 'trainer-welcome',
        context: { trainerId: trainer.id },
      });

      return trainer;
    },
    {
      isolationLevel: 'Serializable', // Prevent phantom reads
    },
  );
}
```

### Thread Safety & Race Condition Prevention

| Mechanism                | Description                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Serializable` isolation | The transaction uses `Serializable` isolation level, which prevents phantom reads. If two concurrent requests read `trainerCount=99` simultaneously, only one will succeed; the other will receive a serialization error and must retry. |
| Row lock via `UPDATE`    | The `PlatformConfig` row is selected and then updated within the same transaction, effectively locking it.                                                                                                                               |
| Idempotency              | Each user can only call `/trainers/apply` once — the unique `userId` constraint on `Trainer` prevents duplicate applications.                                                                                                            |

### Edge Cases

| Scenario                           | Behavior                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `trainerCount` reaches 100 exactly | The 100th applicant gets founding benefits. Applicant 101+ pays standard rates.                                             |
| Founding trainer deletes profile   | `trainerCount` does NOT decrement. The "first 100" refers to the first 100 applications, not the first 100 active trainers. |
| Founding trainer is suspended      | Grandfathered benefits persist on reactivation.                                                                             |
| Late payment of verification fee   | Founding trainers never pay — their fee is `verificationFeePaid=false` and they are already `isVerified=true`.              |
| Race condition (99 → 101)          | `Serializable` isolation + unique constraint prevents more than `freeTrainerLimit` founding trainers.                       |

---

## Frontend Integration

The public endpoint `GET /api/v1/misc/platform-config` returns:

```json
{
  "freeTrainerLimit": 100,
  "trainerCount": 42,
  "remainingFreeSpots": 58
}
```

The frontend uses this to show:

- Call-to-action: "Only 58 free spots remaining — Apply Now!"
- Progress bar on the trainer signup page
- Countdown urgency in marketing banners

---

## Platform Configuration Extensibility

The `PlatformConfig` single-row pattern supports future config values by adding columns:

| Future Column             | Type    | Default | Purpose                                                       |
| ------------------------- | ------- | ------- | ------------------------------------------------------------- |
| `commissionRate`          | Decimal | 20.00   | Default commission rate for new trainers                      |
| `verificationFee`         | Decimal | 5000.00 | Verification badge fee                                        |
| `maxFreeTrainers`         | Int     | 100     | Configurable free trainer limit                               |
| `escrowReleaseDelayHours` | Int     | 24      | Hours before milestone is released after trainee confirmation |
| `maintenanceMode`         | Boolean | false   | Block new enrolments during maintenance                       |

**Strategy:** Add columns and nullable booleans rather than migrating to a JSON blob, preserving type safety and indexing capability.
