import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface UnityBuildUrls {
  loader?: string;
  framework?: string;
  data?: string;
  wasm?: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
}
