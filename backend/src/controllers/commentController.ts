import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export async function addComment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { projectId, content } = req.body;
    if (!projectId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Project ID and content are required' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.user.id,
        projectId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return res.status(201).json(comment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.comment.delete({ where: { id } });
    return res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete comment' });
  }
}
