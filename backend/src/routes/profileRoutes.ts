import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userDb } from '../data/userStore';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

export const profileRouter = Router();

// GET /api/profile (Authenticated user's own profile)
profileRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = userDb.findById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }
  res.json({ user: userDb.toSafeUser(user) });
});

// PUT /api/profile (Authenticated user updates own profile info)
profileRouter.put('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { fullName, phone, bio, company } = req.body;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
      return;
    }

    const updated = userDb.update(req.user.id, {
      name: fullName.trim(),
      profile: {
        fullName: fullName.trim(),
        phone: phone || '',
        bio: bio || '',
        company: company || ''
      }
    });

    res.json({
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update profile.' });
  }
});

// POST /api/profile/change-password (User updates password)
profileRouter.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
      return;
    }

    if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
      res.status(400).json({ error: 'New passwords do not match.' });
      return;
    }

    const user = userDb.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    userDb.update(req.user.id, { passwordHash });

    res.json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});
