import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export async function getAdminStats(req: AuthenticatedRequest, res: Response) {
  try {
    const [userCount, projectCount, commentCount, fileCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.comment.count(),
      prisma.file.count(),
    ]);

    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    return res.json({
      stats: {
        users: userCount,
        projects: projectCount,
        comments: commentCount,
        files: fileCount,
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      recentProjects,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin metrics' });
  }
}

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
}
