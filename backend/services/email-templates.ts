interface EmailTemplate {
  subject: string;
  html: string;
}

export function adminPayoutRequested(trainerName: string, amount: number): EmailTemplate {
  return {
    subject: `New Payout Request — ${trainerName}`,
    html: `
      <h2>New Payout Request</h2>
      <p>Trainer <strong>${trainerName}</strong> has requested a payout of <strong>KES ${amount.toLocaleString()}</strong>.</p>
      <p>Please log in to the admin dashboard to review and process this payment.</p>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/earnings" style="display:inline-block;padding:10px 20px;background:#FF5349;color:white;text-decoration:none;border-radius:8px;">View Payout Requests</a>
    `,
  };
}

export function trainerPaymentProcessed(trainerName: string, amount: number, transactionId: string): EmailTemplate {
  return {
    subject: `Payment Received — KES ${amount.toLocaleString()}`,
    html: `
      <h2>Payment Processed</h2>
      <p>Hello <strong>${trainerName}</strong>,</p>
      <p>Your payout of <strong>KES ${amount.toLocaleString()}</strong> has been processed successfully.</p>
      <p>Transaction reference: <strong>${transactionId}</strong></p>
      <p>Check your M-Pesa for the payment notification.</p>
    `,
  };
}

export function adminNewCoursePublished(trainerName: string, courseTitle: string): EmailTemplate {
  return {
    subject: `New Course Published — ${courseTitle}`,
    html: `
      <h2>New Course Published</h2>
      <p>Trainer <strong>${trainerName}</strong> has published a new course: <strong>${courseTitle}</strong>.</p>
      <p>Review it on the admin dashboard.</p>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/courses" style="display:inline-block;padding:10px 20px;background:#FF5349;color:white;text-decoration:none;border-radius:8px;">View Courses</a>
    `,
  };
}
