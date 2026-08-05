export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: 'USER' | 'ADMIN';
}

export interface UnityUrls {
  indexUrl?: string;
  loader?: string;
  framework?: string;
  data?: string;
  wasm?: string;
}

export interface ProjectFile {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  type: 'MODEL' | 'UNITY';
  status: 'PROCESSING' | 'READY' | 'FAILED';
  thumbnail?: string | null;
  glbUrl?: string | null;
  unityUrls?: UnityUrls | null;
  views: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email?: string;
  };
  comments?: Comment[];
  files?: ProjectFile[];
  _count?: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
  isFavorite?: boolean;
}
