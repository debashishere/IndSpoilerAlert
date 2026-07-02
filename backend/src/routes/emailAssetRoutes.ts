import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/email-assets/timer.svg?expiresAt=...
router.get('/timer.svg', (req: Request, res: Response) => {
  const expiresAtStr = req.query.expiresAt as string;
  let remainingText = '00:00:00';
  let diffSec = 0;

  if (expiresAtStr) {
    const expiresAt = new Date(expiresAtStr).getTime();
    diffSec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const secs = String(diffSec % 60).padStart(2, '0');
    remainingText = `${hrs}:${mins}:${secs}`;
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="60" viewBox="0 0 280 60">
    <rect width="280" height="60" rx="8" fill="#1e293b"/>
    <text x="140" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">BID EXPIRATION REMAINING</text>
    <text x="140" y="48" font-family="monospace" font-size="20" font-weight="bold" fill="#f43f5e" text-anchor="middle">${remainingText}</text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return res.status(200).send(svgContent);
});

// GET /api/email-assets/bid-badge.svg?listingId=...&currentBid=...&cases=...
router.get('/bid-badge.svg', (req: Request, res: Response) => {
  const currentBid = req.query.currentBid ? `$${req.query.currentBid}` : '$15.00';
  const cases = req.query.cases ? `${req.query.cases} Cases` : '100 Cases';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="70" viewBox="0 0 320 70">
    <rect width="320" height="70" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="16" y="26" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" letter-spacing="0.5">CURRENT HIGHEST BID</text>
    <text x="16" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">${currentBid}</text>
    <rect x="200" y="16" width="104" height="38" rx="6" fill="#1e293b"/>
    <text x="252" y="32" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle">LOT VOLUME</text>
    <text x="252" y="48" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#e2e8f0" text-anchor="middle">${cases}</text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return res.status(200).send(svgContent);
});

export default router;
