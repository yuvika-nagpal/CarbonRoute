import { Request, Response } from 'express';
import { storageProvider } from '../storage/storageProvider';
import mime from 'mime-types';

export const serveFile = async (req: Request, res: Response) => {
  try {
    const category = String(req.params.category || '');
    const fileName = String(req.params.fileName || '');

    if (!category || !fileName) {
      return res.status(400).send('Category and fileName are required.');
    }

    const { stream, fileSize } = await storageProvider.getFileStream(category, fileName);

    const lookupMime = mime.lookup(fileName) || 'application/octet-stream';
    res.setHeader('Content-Type', lookupMime);
    if (fileSize) {
      res.setHeader('Content-Length', fileSize.toString());
    }

    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    }

    return stream.pipe(res);
  } catch (error: any) {
    console.error('File serve error:', error);
    return res.status(404).json({
      success: false,
      message: 'The requested file does not exist or has been removed from storage.',
    });
  }
};
