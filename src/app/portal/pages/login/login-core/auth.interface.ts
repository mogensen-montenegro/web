import {Data} from "@angular/router";

export interface TokenInterface {
  token: string | null;
  refreshToken: string | null;
  accessToken: string | null;
}

export interface LoginResponse {
  ok: boolean;
  msj: string;
  auth: TokenInterface;
  sessionId: string;
  version: string;
  userId: string;
  ownerUserId?: string | null;
  user?: string;
  nombre?: string;
  documento?: string | null;
  role?: 'admin' | 'superuser' | 'personal';
  permisosModulos?: Record<string, boolean> | null;
  sessionTimeout: Data;
}

export interface LoginDataRequest {
  user: string | null | undefined;
  password: string | null | undefined;
}
