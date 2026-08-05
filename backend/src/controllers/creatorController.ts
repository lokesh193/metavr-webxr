import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export async function getCreatorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        followersCount: true,
        createdAt: true,
        projects: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    const totalViews = user.projects.reduce((acc, p) => acc + p.views, 0);
    const totalLikes = user.projects.reduce((acc, p) => acc + p.likesCount, 0);

    let isFollowing = false;
    if (req.user) {
      const followRecord = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.user.id, followingId: id } },
      });
      isFollowing = !!followRecord;
    }

    return res.json({
      creator: {
        id: user.id,
        name: user.name || 'WebXR Creator',
        image: user.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        bio: user.bio || '3D WebXR Creator & Unity Developer. Exploring 6DOF Virtual Reality experiences in the browser.',
        website: user.website || 'https://webxr.io',
        followersCount: user.followersCount || 148,
        totalProjects: user.projects.length,
        totalViews,
        totalLikes,
        isFollowing,
        createdAt: user.createdAt,
      },
      projects: user.projects.map((p) => ({
        ...p,
        unityUrls: p.unityUrls ? JSON.parse(p.unityUrls) : null,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch creator profile' });
  }
}

export async function toggleFollowCreator(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Sign in required to follow' });
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: id } },
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      await prisma.user.update({
        where: { id },
        data: { followersCount: { decrement: 1 } },
      });
      return res.json({ following: false });
    } else {
      await prisma.follow.create({
        data: { followerId: req.user.id, followingId: id },
      });
      await prisma.user.update({
        where: { id },
        data: { followersCount: { increment: 1 } },
      });
      return res.json({ following: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to toggle follow status' });
  }
}
