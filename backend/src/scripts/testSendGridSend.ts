import dotenv from 'dotenv';
import { sendSendGridEmail } from '../services/emailService';

dotenv.config();

async function run() {
  console.log('--- SendGrid Integration Verification ---');

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('ERROR: SENDGRID_API_KEY is not set in environment variables.');
    console.log('Please set SENDGRID_API_KEY=SG.your_api_key in backend/.env before running this script.');
    process.exit(1);
  }

  const to = process.env.TEST_TO_EMAIL || 'debashishere007@gmail.com';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@indspoileralert.com';

  console.log(`Sending verification test email...`);
  console.log(`To: ${to}`);
  console.log(`From: ${fromEmail}`);
  if (process.env.SENDGRID_DATA_RESIDENCY) {
    console.log(`Data Residency: ${process.env.SENDGRID_DATA_RESIDENCY}`);
  }

  try {
    const result = await sendSendGridEmail({
      to,
      subject: 'SendGrid Integration Test - SpoilerAlert Platform',
      text: 'Congratulations! SendGrid email integration with SpoilerAlert platform is working successfully.',
      html: '<h2>SendGrid Integration Test</h2><p>Congratulations! SendGrid email integration with SpoilerAlert platform is working successfully.</p>',
      fromEmail,
    });

    console.log('✅ SendGrid verification email sent successfully!');
    console.log('Response Details:', result);
  } catch (err: any) {
    console.error('❌ Failed to send email via SendGrid:', err.response ? err.response.body : err.message);
  }
}

run();
