import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';

// ─── Types ───────────────────────────────────────────────────

interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  category?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: 'attachment' | 'inline';
  }>;
}

// ─── Redis Connection ────────────────────────────────────────

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Queue ────────────────────────────────────────────────────

export const emailQueue = new Queue<EmailJobData>('emails', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 10s, 50s
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

// ─── SendGrid Service ─────────────────────────────────────────

function parseEmailFrom(fromString: string): {
  email: string;
  name: string;
} {
  const match = fromString.match(/^"?([^"]*)"?\s*<(.+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'Vuka', email: fromString.trim() };
}

async function sendViaSendGrid(jobData: EmailJobData): Promise<{ success: boolean; messageId?: string }> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    throw new Error('SENDGRID_API_KEY environment variable is required');
  }

  const emailFrom = process.env.EMAIL_FROM || 'Vuka <noreply@vuka.africa>';
  const from = parseEmailFrom(emailFrom);

  const recipients = Array.isArray(jobData.to) ? jobData.to : [jobData.to];

  const payload: Record<string, any> = {
    personalizations: recipients.map((email) => ({
      to: [{ email }],
    })),
    from: { email: from.email, name: from.name },
    subject: jobData.subject,
    content: [{ type: 'text/html', value: jobData.html }],
  };

  // Add category for SendGrid analytics
  if (jobData.category) {
    payload.categories = [jobData.category];
  }

  // Add attachments if provided
  if (jobData.attachments?.length) {
    payload.attachments = jobData.attachments;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid API error: ${res.status} ${body}`);
  }

  // SendGrid returns 202 with no body on success
  const messageId = res.headers.get('x-message-id') || `email-${Date.now()}`;

  return { success: true, messageId };
}

// ─── Worker ───────────────────────────────────────────────────

const worker = new Worker<EmailJobData>(
  'emails',
  async (job: Job<EmailJobData>) => {
    const { to, subject, category } = job.data;

    const recipientList = Array.isArray(to) ? to : [to];
    console.log(
      `[email-worker] Sending email: "${subject}" to ${recipientList.length} recipient(s)${category ? ` [${category}]` : ''}`,
    );

    try {
      const result = await sendViaSendGrid(job.data);
      console.log(`[email-worker] Email sent successfully: ${result.messageId}`);
      return result;
    } catch (err: any) {
      console.error(`[email-worker] Failed to send email:`, err.message);
      throw err; // BullMQ will retry
    }
  },
  {
    connection,
    concurrency: 10, // SendGrid allows high concurrency
    limiter: {
      max: 100, // Max 100 emails
      duration: 1000, // Per second (SendGrid free tier limit)
    },
  },
);

// ─── Job Adders ───────────────────────────────────────────────

export async function sendEmail(data: EmailJobData): Promise<void> {
  await emailQueue.add('send-email', data, {
    // Use subject + timestamp as deduplication key
    jobId: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });
}

export async function sendBulkEmails(emails: EmailJobData[]): Promise<void> {
  const jobs = emails.map((email) => ({
    name: 'send-email',
    data: email,
    opts: {
      jobId: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  }));

  await emailQueue.addBulk(jobs);
}

// ─── Graceful Shutdown ────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[email-worker] Shutting down...');
  await worker.close();
  await emailQueue.close();
  connection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[email-worker] Shutting down...');
  await worker.close();
  await emailQueue.close();
  connection.disconnect();
  process.exit(0);
});

console.log('[email-worker] Worker started and waiting for jobs...');
