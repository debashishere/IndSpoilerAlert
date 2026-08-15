import sgMail from '@sendgrid/mail';
import { sendSendGridEmail, sendEmailHelper, sendCampaignEmail } from '../services/emailService';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  setDataResidency: jest.fn(),
  send: jest.fn(),
}));

describe('SendGrid Mail Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw error when SENDGRID_API_KEY is not configured', async () => {
    delete process.env.SENDGRID_API_KEY;
    await expect(
      sendSendGridEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test Body',
      })
    ).rejects.toThrow('SENDGRID_API_KEY environment variable is not configured');
  });

  it('should set API key and send email via SendGrid', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test_key_123';
    process.env.SENDGRID_FROM_EMAIL = 'verified@domain.com';
    (sgMail.send as jest.Mock).mockResolvedValueOnce([
      {
        statusCode: 202,
        headers: { 'x-message-id': 'sg-msg-999' },
      },
    ]);

    const result = await sendSendGridEmail({
      to: 'buyer@example.com',
      subject: 'Surplus Clearance Offer',
      text: 'Surplus items available',
    });

    expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test_key_123');
    expect(sgMail.send).toHaveBeenCalledWith({
      to: 'buyer@example.com',
      from: {
        email: 'verified@domain.com',
        name: 'IndSpoiler Alert Platform',
      },
      subject: 'Surplus Clearance Offer',
      text: 'Surplus items available',
      html: 'Surplus items available',
    });
    expect(result).toEqual({
      success: true,
      messageId: 'sg-msg-999',
      statusCode: 202,
    });
  });

  it('should call setDataResidency("eu") when SENDGRID_DATA_RESIDENCY is "eu"', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test_eu_key';
    process.env.SENDGRID_DATA_RESIDENCY = 'eu';
    (sgMail as any).setDataResidency = jest.fn();
    (sgMail.send as jest.Mock).mockResolvedValueOnce([
      {
        statusCode: 202,
        headers: { 'x-message-id': 'sg-eu-msg' },
      },
    ]);

    await sendSendGridEmail({
      to: 'eu-buyer@example.com',
      subject: 'EU Order',
      text: 'EU content',
    });

    expect((sgMail as any).setDataResidency).toHaveBeenCalledWith('eu');
  });

  it('should route sendEmailHelper through SendGrid when API key is provided', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test_helper';
    (sgMail.send as jest.Mock).mockResolvedValueOnce([
      {
        statusCode: 202,
        headers: { 'x-message-id': 'sg-helper-msg' },
      },
    ]);

    const res = await sendEmailHelper('target@example.com', 'Helper Subj', 'Helper Text');
    expect(res.success).toBe(true);
    expect(res.messageId).toBe('sg-helper-msg');
  });

  it('should route sendCampaignEmail through SendGrid when API key is provided', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test_campaign';
    (sgMail.send as jest.Mock).mockResolvedValueOnce([
      {
        statusCode: 202,
        headers: { 'x-message-id': 'sg-campaign-msg' },
      },
    ]);

    const res = await sendCampaignEmail(
      'supplier-1',
      'target@example.com',
      'Campaign Subj',
      '<div>Campaign HTML</div>'
    );
    expect(res.success).toBe(true);
    expect(res.messageId).toBe('sg-campaign-msg');
  });
});
