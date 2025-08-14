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
  sessionTimeout: Data;
}

export interface LoginDataRequest {
  user: string | null | undefined;
  password: string | null | undefined;
}
