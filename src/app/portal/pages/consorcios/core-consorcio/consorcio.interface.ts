export interface Consorcio {
  _id?: string;
  nombre: string;
  encargado: string;
  telefono: string;
  direccion: string;
  cuit?: string;
  observaciones?: string;
  cantidadCarpetas?: number;
  cantidadArchivos?: number;
  idAdmin?: string;
}

export interface ConsorcioResponse {
  ok: boolean;
  msj: string;
  body: Consorcio[]
}

export interface CrearConsorcioResponse {
  ok: boolean;
  msj: string;
  body: Consorcio
}
