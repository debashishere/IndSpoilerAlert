import dotenv from 'dotenv';
import { sendEmailHelper } from '../services/emailService';

dotenv.config();

async function run() {
  console.log('--- Gmail SMTP Verification ---');

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || pass === 'YOUR_GMAIL_APP_PASSWORD') {
    console.error('ERROR: SMTP_PASS is not configured in backend/.env');
    console.log('Please set your 16-character Gmail App Password in backend/.env as SMTP_PASS=xxxx xxxx xxxx xxxx');
    process.exit(1);
  }

  const to = 'debashishere007@gmail.com';
  console.log(`Sending Gmail SMTP test email...`);
  console.log(`Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`From: ${user}`);
  console.log(`To: ${to}`);

  try {
    const result = await sendEmailHelper(
      to,
      'Gmail SMTP Test - SpoilerAlert Platform',
      'Success! Gmail SMTP email dispatch is working for your SpoilerAlert MVP.',
      user,
      'SpoilerAlert Platform'
    );

    if (result.success) {
      console.log('✅ Gmail SMTP email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send email via Gmail SMTP:', result.error);
    }
  } catch (err: any) {
    console.error('❌ Error executing Gmail SMTP send:', err.message);
  }
}

run();
