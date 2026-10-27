export interface AdminEmailImagen {
  nombre: string;
  base64: string;
}

export interface AdminEmailPayload {
  to: string;            // correo del admin
  subject: string;       // asunto
  html: string;          // cuerpo ya renderizado con variables
  imagen?: AdminEmailImagen;
  cc?: string[];
  bcc?: string[];
  meta?: { adminId?: string; triggeredBy?: string };
}

export interface ApiResponse {
  ok: boolean;
  msj: string;
}
