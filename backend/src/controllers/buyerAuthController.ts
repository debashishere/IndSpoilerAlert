import { Request, Response } from 'express';
import * as buyerAuthService from '../services/buyerAuthService';

export async function sendVerification(req: Request, res: Response) {
  try {
    const { email, companyName } = req.body;
    const result = await buyerAuthService.sendVerificationToken(email, companyName);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to send verification token' });
  }
}

export async function verifyToken(req: Request, res: Response) {
  try {
    const { email, token } = req.body;
    const result = await buyerAuthService.verifyToken(email, token);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Verification failed' });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const result = await buyerAuthService.getSession(authHeader);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ authenticated: false, error: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const result = await buyerAuthService.logoutSession(authHeader);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
