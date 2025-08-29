export interface Administrador {
  _id?: string
  nombre: string,
  email: string,
  telefono: string,
  direccion: string,
  consorciosCount: number,
  user: string,
  password: string
}

export interface AdministradorResponse {
  ok: boolean;
  msj: string;
  body: Administrador[]
}
