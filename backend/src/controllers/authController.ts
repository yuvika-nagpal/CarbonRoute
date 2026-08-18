import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../models/db';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both username (or email) and password.',
    });
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials.',
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials.',
    });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  db.addAuditLog('USER_LOGIN', 'User', user.id, `User ${user.username} logged in`, user.username);

  return res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
  }

  return res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

export const logout = (req: AuthRequest, res: Response) => {
  if (req.user) {
    db.addAuditLog('USER_LOGOUT', 'User', req.user.id, `User ${req.user.username} logged out`, req.user.username);
  }
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};
