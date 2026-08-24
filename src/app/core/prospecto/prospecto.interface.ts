export type ProspectoEstado = 'nuevo' | 'contactado';

export interface ProspectoAdjunto {
  nombre: string;
  tipo: string;
  base64: string;
}

export interface Prospecto {
  id?: string;
  nombre: string;
  email: string;
  telefono: string;
  rol?: string;
  nombreConsorcio?: string;
  direccion: string;
  localidad: string;
  codigoPostal?: string;
  cuit?: string;
  tipoEdificio?: string;
  unidadesFuncionales?: number | null;
  cantidadPlantas?: number | null;
  metrosCuadrados?: number | null;
  anioConstruccion?: number | null;
  cantidadAscensores?: number | null;
  tieneCocheras?: boolean | null;
  espaciosComunes?: string[];
  polizaVigente?: boolean | null;
  companiaActual?: string;
  comentarios?: string;
  reglamento?: ProspectoAdjunto | null;
  polizaActual?: ProspectoAdjunto | null;
  estado?: ProspectoEstado;
  createdAt?: string;
}

export interface ProspectoResponse {
  ok: boolean;
  msj?: string;
  body?: Prospecto | Prospecto[];
}

export const ROLES_CONTACTO = [
  { value: 'Administrador', label: 'Administrador de consorcio' },
  { value: 'Presidente', label: 'Presidente / consejo de administración' },
  { value: 'Propietario', label: 'Propietario' },
  { value: 'Otro', label: 'Otro' }
];

export const TIPOS_EDIFICIO = [
  { value: 'PH residencial', label: 'Edificio de propiedad horizontal (viviendas)' },
  { value: 'Mixto', label: 'Mixto (viviendas y locales / oficinas)' },
  { value: 'Oficinas', label: 'Oficinas' },
  { value: 'Country', label: 'Country / barrio cerrado' },
  { value: 'Otro', label: 'Otro' }
];

export const ESPACIOS_COMUNES = [
  { value: 'pileta', label: 'Pileta' },
  { value: 'sum', label: 'SUM / salón de usos múltiples' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'terraza', label: 'Terraza / quincho' },
  { value: 'jardin', label: 'Jardín / parrilla' },
  { value: 'vigilancia', label: 'Vigilancia / portería' }
];
