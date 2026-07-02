import { Router, Request, Response } from 'express';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';

const router = Router();

// Helper to determine public callback URL
const getRedirectUri = (req: Request) => {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  return `${protocol}://${host}/api/oauth/callback`;
};

// GET /api/oauth/start?supplierId=...
router.get('/start', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.query;
    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'supplierId required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getRedirectUri(req);

    console.log(`Initiating OAuth start for supplier '${supplierId}'. GOOGLE_CLIENT_ID present: ${!!clientId}`);

    if (clientId) {
      const scope = encodeURIComponent('https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email');
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${encodeURIComponent(String(supplierId))}`;
      console.log('Redirecting to Google OAuth URL:', googleAuthUrl);
      return res.redirect(googleAuthUrl);
    }

    // Dev/Test fallback mode when GOOGLE_CLIENT_ID is not configured
    const redirectUrl = `/api/oauth/callback?code=mock-auth-code&state=${encodeURIComponent(String(supplierId))}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error starting OAuth flow:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/oauth/status?supplierId=...
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.query;
    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'supplierId required' });
    }

    const mailbox = await SupplierOAuthMailbox.findOne({ supplierId });
    
    if (!mailbox) {
      return res.json({ success: true, status: 'missing' });
    }

    res.json({ 
      success: true, 
      status: mailbox.status,
      userEmail: mailbox.userEmail || mailbox.accountId || null
    });
  } catch (err) {
    console.error('Error fetching OAuth status:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/oauth/callback?code=...&state=supplierId
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ success: false, message: 'code and state are required' });
    }

    const supplierId = state as string;
    let accessToken = 'mock-access-token';
    let refreshToken = 'mock-refresh-token';
    let accountId = 'mock-account-id';
    let userEmail = 'supplier@company.com';

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);

    if (clientId && clientSecret && code !== 'mock-auth-code') {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: String(code),
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        const tokenData: any = await tokenRes.json();
        if (!tokenRes.ok) {
          console.error('Google OAuth token exchange error:', tokenData);
          return res.status(400).send(`OAuth Error: ${tokenData.error_description || tokenData.error || 'Token exchange failed'}`);
        }

        accessToken = tokenData.access_token || accessToken;
        if (tokenData.refresh_token) {
          refreshToken = tokenData.refresh_token;
        }

        // Retrieve Google user email profile
        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (profileRes.ok) {
            const profileData: any = await profileRes.json();
            userEmail = profileData.email || userEmail;
            accountId = profileData.email || accountId;
          }
        } catch (profileErr) {
          console.warn('Could not fetch Google user profile:', profileErr);
        }
      } catch (tokenErr) {
        console.error('Network error during Google OAuth token exchange:', tokenErr);
        return res.status(500).send('Network error during OAuth token exchange');
      }
    }

    const existing = await SupplierOAuthMailbox.findOne({ supplierId });
    const finalRefreshToken = refreshToken !== 'mock-refresh-token' ? refreshToken : (existing?.refreshToken || refreshToken);

    await SupplierOAuthMailbox.findOneAndUpdate(
      { supplierId },
      {
        supplierId,
        accountId: accountId || userEmail,
        userEmail: userEmail || accountId,
        accessToken,
        refreshToken: finalRefreshToken,
        status: 'connected'
      },
      { upsert: true, new: true }
    );

    if (req.headers.accept?.includes('text/html') && !req.headers.accept?.includes('application/json')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google OAuth Mailbox Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; padding: 2.5rem; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; }
            .icon { width: 48px; height: 48px; background: rgba(52, 211, 153, 0.15); color: #34d399; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 24px; font-weight: bold; }
            h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #ffffff; }
            p { color: #94a3b8; font-size: 0.875rem; margin: 0 0 1.25rem 0; }
            .email-badge { display: inline-block; background: #0f172a; border: 1px solid #334155; color: #818cf8; padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; }
            .btn { background: #6366f1; color: white; border: none; padding: 0.6rem 1.4rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 0.875rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>Google Mailbox Connected!</h2>
            <div class="email-badge">${userEmail}</div>
            <p>Your Google Workspace account was authorized successfully for campaign dispatches.</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              try { window.opener.postMessage('oauth-connected', '*'); } catch(e){}
            }
            setTimeout(() => { try { window.close(); } catch(e){} }, 1800);
          </script>
        </body>
        </html>
      `);
    }

    res.json({ success: true, message: 'Mailbox connected successfully', email: userEmail });
  } catch (err) {
    console.error('Error in OAuth callback:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
