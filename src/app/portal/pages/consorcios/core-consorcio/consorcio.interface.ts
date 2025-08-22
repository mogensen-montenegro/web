export interface Consorcio {
  _id?: string;
  nombre: string;
  encargado: string;
  telefono: string;
  direccion: string;
  cantidadCarpetas: number;
  cantidadArchivos: number;
}

export interface ConsorcioResponse {
  ok: boolean;
  msj: string;
  body: Consorcio[]
}
