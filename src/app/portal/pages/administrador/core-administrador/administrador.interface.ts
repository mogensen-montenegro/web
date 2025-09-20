export interface Administrador {
  _id?: string
  nombre: string,
  email: string,
  telefono: string,
  direccion: string,
  consorciosCount: number,
  user: string,
  cuit: string,
  fechaNacimiento: string,
  observacion: string,
  password: string
}

export interface AdministradorResponse {
  ok: boolean;
  msj: string;
  body: Administrador[]
}

export type SubmitEvent = { mode: 'create' | 'edit', payload: Administrador, id?: string };
