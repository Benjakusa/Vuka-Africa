-- ==============================================================================
-- Migration: In-App Messaging Schema and Policies
-- Description: Creates the Message table and enforces communication rules
-- ==============================================================================

CREATE TABLE "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- Enable RLS
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- 1. READ: Users can read messages if they are the sender or receiver
CREATE POLICY "Users can read their own messages" ON "Message"
FOR SELECT USING (
    "senderId" = auth.uid()::text OR "receiverId" = auth.uid()::text
);

-- 2. INSERT: Enforce strict communication rules
CREATE POLICY "Users can send messages based on rules" ON "Message"
FOR INSERT WITH CHECK (
    "senderId" = auth.uid()::text AND (
        -- Rule 1: Sender is Admin (can send to anyone)
        EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
        OR 
        -- Rule 2: Receiver is Admin (anyone can send to Admin)
        EXISTS (SELECT 1 FROM "User" WHERE id = "receiverId" AND role = 'ADMIN')
        OR
        -- Rule 3: Trainer to Trainee (Must have an enrolment)
        (
            EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'TRAINER') AND
            EXISTS (
                SELECT 1 FROM "Enrolment" e
                JOIN "Trainer" t ON e."trainerId" = t.id
                WHERE t."userId" = auth.uid()::text AND e."traineeId" = "receiverId"
            )
        )
        OR
        -- Rule 4: Trainee to Trainer (Must have an enrolment)
        (
            EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'TRAINEE') AND
            EXISTS (
                SELECT 1 FROM "Enrolment" e
                JOIN "Trainer" t ON e."trainerId" = t.id
                WHERE e."traineeId" = auth.uid()::text AND t."userId" = "receiverId"
            )
        )
    )
);

-- 3. UPDATE: Users can update messages to mark them as read (if they are the receiver)
CREATE POLICY "Receivers can mark messages as read" ON "Message"
FOR UPDATE USING (
    "receiverId" = auth.uid()::text
) WITH CHECK (
    "receiverId" = auth.uid()::text
);
