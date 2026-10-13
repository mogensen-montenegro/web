export interface ReporteRegistro {
  _id?: string;
  nombre: string;
  documento: string;
  user?: string;
  tipo?: 'asistencia' | 'accion';
  accionRealizada: string;
  moduloModificacion: string;
  resultadoModificacion: string;
  estado?: string;
  detalle?: string;
  fechaDeRegistro: string;
  horaRegistro: string;
  registradoEnISO?: string | null;
}

export interface ReportesResponse {
  ok: boolean;
  registros: ReporteRegistro[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface ReportesResumen {
  registrosDelDia: number;
  primerIngreso: string | null;
  ultimoMovimiento: string | null;
  diasConActividad: number;
  diasDelMes: number;
  timeline: ReporteRegistro[];
}

export interface ReportesResumenResponse {
  ok: boolean;
  resumen: ReportesResumen;
}

export interface ReportesFiltro {
  tipo: 'asistencia' | 'accion';
  documento?: string | null;
  dia?: string | number | null;
  mes?: string | number | null;
  anio?: string | number | null;
}
