import { Request, Response } from 'express';
import { db } from '../models/db';
import { storageProvider } from '../storage/storageProvider';
import { AuthRequest } from '../middleware/auth';

export const getResources = (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const resources = db.getResources(category).filter((r) => r.isPublished);

  return res.json({
    success: true,
    data: resources,
  });
};

export const getAllResourcesAdmin = (req: AuthRequest, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const resources = db.getResources(category);

  return res.json({
    success: true,
    data: resources,
  });
};

export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded.',
      });
    }

    const { title, category, description, isPublished } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required.',
      });
    }

    const stored = await storageProvider.saveFile(file, 'resources');

    const newResource = db.addResource({
      title: String(title),
      category: category as any,
      description: description ? String(description) : '',
      fileName: stored.fileName,
      filePath: stored.filePath,
      fileSize: stored.fileSize,
      mimeType: stored.mimeType,
      fileUrl: stored.fileUrl,
      isPublished: isPublished === 'true' || isPublished === true,
    });

    db.addAuditLog(
      'CREATE_RESOURCE',
      'Resource',
      newResource.id,
      `Resource uploaded: ${title} (${category})`,
      req.user ? req.user.username : 'System'
    );

    return res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully.',
      data: newResource,
    });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload resource.',
    });
  }
};

export const deleteResource = (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const deleted = db.deleteResource(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found.',
    });
  }

  db.addAuditLog(
    'DELETE_RESOURCE',
    'Resource',
    id,
    `Resource deleted: ${id}`,
    req.user ? req.user.username : 'System'
  );

  return res.json({
    success: true,
    message: 'Resource deleted successfully.',
  });
};
