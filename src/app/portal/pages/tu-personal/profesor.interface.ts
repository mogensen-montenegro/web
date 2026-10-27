export type PersonalModuloId =
  | 'consorcio'
  | 'consorcios'
  | 'base'
  | 'generador-recibos'
  | 'noticia'
  | 'plantillas-email'
  | 'prospectos'
  | 'drive'
  | 'driveBorrar'
  | 'addProf';

export type PersonalPermisosModulos = Record<PersonalModuloId, boolean>;

export interface PersonalModuloConfig {
  id: Exclude<PersonalModuloId, 'addProf'>;
  label: string;
}

export interface Profesores {
  _id?: string;
  id?: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  password: string;
  direccion: string;
  fechaNacimiento: string;
  horario: string;
  especialidad: string;
  cargo: string;
  user: string;
  permisosModulos?: Partial<PersonalPermisosModulos>;
}

export interface PersonalResponse {
  ok: boolean;
  msj?: string;
  body?: Profesores | Profesores[];
}

export type PersonalSubmitEvent = {
  mode: 'create' | 'edit' | 'delete';
  payload: Profesores;
  id?: string;
  updatePassword?: boolean;
};

export interface DatoPersonal {
  _id?: string;
  nombre: string;
  documento: string;
  accionRealizada: string;
  moduloModificacion: string;
  resultadoModificacion: string;
  estado?: string;
  detalle?: string;
  tipo?: 'asistencia' | 'accion';
  fechaDeRegistro: string;
  horaRegistro: string;
  registradoEnISO?: string | null;
}

export interface ResponseDatoPersonal {
  registros: DatoPersonal[];
  total: number;
  totalPages: number;
  currentPage: number;
}
