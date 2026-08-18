import { Request, Response } from 'express';
import { db } from '../models/db';
import { AuthRequest } from '../middleware/auth';

export const getRoadmap = (_req: Request, res: Response) => {
  const milestones = db.getRoadmapMilestones();
  return res.json({
    success: true,
    data: milestones,
  });
};

export const updateRoadmapMilestone = (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { status, title, description, startDate, targetDate, deliverables, dependencies } = req.body;

  const updated = db.updateRoadmapMilestone(id, {
    ...(status !== undefined && { status }),
    ...(title !== undefined && { title: String(title) }),
    ...(description !== undefined && { description: String(description) }),
    ...(startDate !== undefined && { startDate: String(startDate) }),
    ...(targetDate !== undefined && { targetDate: String(targetDate) }),
    ...(deliverables !== undefined && { deliverables }),
    ...(dependencies !== undefined && { dependencies }),
  });

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Roadmap milestone not found.',
    });
  }

  db.addAuditLog(
    'UPDATE_ROADMAP_MILESTONE',
    'RoadmapMilestone',
    id,
    `Updated ${updated.phaseName}: status set to ${updated.status}`,
    req.user ? req.user.username : 'System'
  );

  return res.json({
    success: true,
    message: `Milestone ${updated.phaseName} updated successfully.`,
    data: updated,
  });
};
