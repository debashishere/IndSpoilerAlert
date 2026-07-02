import Buyer from '../models/Buyer';

// In-memory pending OTPs and active session tokens
const pendingOtps = new Map<string, { otp: string; expiresAt: number; companyName?: string }>();
const activeSessions = new Map<string, any>();

export async function sendVerificationToken(email: string, companyName?: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Valid email address is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  pendingOtps.set(normalizedEmail, {
    otp: devOtp,
    expiresAt,
    companyName: companyName || 'Verified Buyer'
  });

  return {
    success: true,
    message: 'Verification token sent to email',
    email: normalizedEmail,
    devOtp
  };
}

export async function verifyToken(email: string, token: string) {
  if (!email || !token) {
    throw new Error('Email and verification token are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = pendingOtps.get(normalizedEmail);

  if (!record || record.otp !== token.trim()) {
    throw new Error('Invalid or expired verification token.');
  }

  if (Date.now() > record.expiresAt) {
    pendingOtps.delete(normalizedEmail);
    throw new Error('Verification token has expired.');
  }

  // Clear OTP record
  pendingOtps.delete(normalizedEmail);

  // Find or create buyer in DB/store
  let buyer = await Buyer.findOne({ email: normalizedEmail });
  if (!buyer) {
    const lat = 41.8781 + (Math.random() - 0.5) * 2;
    const lng = -87.6298 + (Math.random() - 0.5) * 2;
    buyer = new Buyer({
      companyName: record.companyName || 'Verified Buyer',
      email: normalizedEmail,
      isVerified: true,
      acceptsShortDated: true,
      minShelfLife: 5,
      categories: ['Dairy', 'Produce', 'Meat', 'Dry Goods', 'Beverages'],
      transportRadius: 150,
      warehouseLocations: [{ lat, lng }]
    });
  } else {
    buyer.isVerified = true;
  }
  await buyer.save();

  // Create session
  const sessionToken = `buyer_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const buyerProfile = {
    id: buyer._id.toString(),
    email: buyer.email,
    companyName: buyer.companyName,
    isVerified: buyer.isVerified,
    categories: buyer.categories
  };

  activeSessions.set(sessionToken, buyerProfile);

  return {
    success: true,
    token: sessionToken,
    buyer: buyerProfile
  };
}

export async function getSession(sessionToken?: string) {
  if (!sessionToken) {
    return { authenticated: false };
  }

  const cleanToken = sessionToken.replace(/^Bearer\s+/i, '').trim();
  const buyerProfile = activeSessions.get(cleanToken);

  if (!buyerProfile) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    buyer: buyerProfile
  };
}

export async function logoutSession(sessionToken?: string) {
  if (sessionToken) {
    const cleanToken = sessionToken.replace(/^Bearer\s+/i, '').trim();
    activeSessions.delete(cleanToken);
  }
  return { success: true, message: 'Logged out successfully' };
}
