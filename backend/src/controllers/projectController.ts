import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const { type, search, page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type && (type === 'MODEL' || type === 'UNITY')) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const formatted = projects.map((p) => ({
      ...p,
      unityUrls: p.unityUrls ? JSON.parse(p.unityUrls) : null,
    }));

    return res.json({
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        files: true,
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { likes: true, favorites: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Increment views
    await prisma.project.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    let isLiked = false;
    let isFavorite = false;
    if (req.user) {
      const [like, fav] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_projectId: { userId: req.user.id, projectId: id } },
        }),
        prisma.favorite.findUnique({
          where: { userId_projectId: { userId: req.user.id, projectId: id } },
        }),
      ]);
      isLiked = !!like;
      isFavorite = !!fav;
    }

    return res.json({
      ...project,
      unityUrls: project.unityUrls ? JSON.parse(project.unityUrls) : null,
      isLiked,
      isFavorite,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch project detail' });
  }
}

export async function toggleLike(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const existingLike = await prisma.like.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: id } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      await prisma.project.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      });
      return res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { userId: req.user.id, projectId: id },
      });
      await prisma.project.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
      });
      return res.json({ liked: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to toggle like' });
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title: title || project.title,
        description: description !== undefined ? description : project.description,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update project' });
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await prisma.project.delete({ where: { id } });
    return res.json({ message: 'Project successfully deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
}
