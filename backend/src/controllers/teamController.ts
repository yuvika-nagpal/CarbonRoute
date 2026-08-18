import { Request, Response } from 'express';
import { db } from '../models/db';
import { AuthRequest } from '../middleware/auth';

export const getTeam = (_req: Request, res: Response) => {
  const team = db.getTeamMembers();
  return res.json({
    success: true,
    data: team,
  });
};

export const updateTeamMember = (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { role, bio, githubUrl, linkedinUrl, avatarUrl } = req.body;

  const updated = db.updateTeamMember(id, {
    ...(role !== undefined && { role: String(role) }),
    ...(bio !== undefined && { bio: String(bio) }),
    ...(githubUrl !== undefined && { githubUrl: String(githubUrl) }),
    ...(linkedinUrl !== undefined && { linkedinUrl: String(linkedinUrl) }),
    ...(avatarUrl !== undefined && { avatarUrl: String(avatarUrl) }),
  });

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Team member not found.',
    });
  }

  db.addAuditLog(
    'UPDATE_TEAM_MEMBER',
    'TeamMember',
    id,
    `Updated info for ${updated.name}`,
    req.user ? req.user.username : 'System'
  );

  return res.json({
    success: true,
    message: `Team member ${updated.name} updated successfully.`,
    data: updated,
  });
};
