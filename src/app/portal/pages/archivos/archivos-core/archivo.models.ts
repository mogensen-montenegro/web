export interface ApiResponse<T> {
  ok: boolean;
  msj: string;

  [key: string]: any;
}

export interface Carpeta {
  _id: string;
  consorcioId: string;
  titulo: string;
  createdAt: string;
  updatedAt: string;
  cantidadArchivos?: number;
}

export interface Archivo {
  _id: string;
  consorcioId: string;
  carpetaId: string;
  nombreOriginal: string;
  mimetype: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}
