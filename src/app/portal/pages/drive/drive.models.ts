import { DriveItem } from '../configuracion/configuracion.service';

export type AlineacionTexto = 'left' | 'center' | 'right';
export type PaletaFmt = 'color' | 'fill' | null;
export type TipoArchivoDrive = 'folder' | 'word' | 'sheet' | 'slides' | 'file';

export interface CeldaHoja {
  v: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  font: string;
  size: number;
  color: string;
  fill: string;
  align: AlineacionTexto;
}

export interface HojaDrive {
  name: string;
  rows: CeldaHoja[][];
  cargada?: boolean;
}

export interface SeleccionHoja {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export const DRIVE_FUENTES = ['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Verdana', 'Courier New', 'Trebuchet MS'];

export const DRIVE_COLORES = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e2', '#0000ff',
  '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#cfe2f3',
  '#c9daf8', '#d9d2e9', '#ead1dc'
];

export const celdaVacia = (): CeldaHoja => ({
  v: '',
  bold: false,
  italic: false,
  underline: false,
  font: 'Arial',
  size: 11,
  color: '#000000',
  fill: '',
  align: 'left'
});

export const tipoArchivo = (item: DriveItem): TipoArchivoDrive => {
  if (item.isFolder) return 'folder';
  const mime = item.mimeType || '';
  const name = item.name || '';
  if (mime.includes('spreadsheet') || mime.includes('excel') || /\.xlsx?$/i.test(name) || /\.csv$/i.test(name)) {
    return 'sheet';
  }
  if (mime.includes('presentation') || mime.includes('powerpoint') || /\.pptx?$/i.test(name)) {
    return 'slides';
  }
  if (mime.includes('document') || mime.includes('word') || /\.docx?$/i.test(name)) {
    return 'word';
  }
  return 'file';
};

export const iconoDrive = (item: DriveItem): string => {
  const tipo = tipoArchivo(item);
  if (tipo === 'folder') return 'fa-folder';
  if (tipo === 'sheet') return 'fa-file-excel';
  if (tipo === 'slides') return 'fa-file-powerpoint';
  if (tipo === 'word') return 'fa-file-word';
  const mime = item.mimeType || '';
  const name = item.name || '';
  if (mime.includes('pdf') || /\.pdf$/i.test(name)) return 'fa-file-pdf';
  if (mime.startsWith('image/')) return 'fa-file-image';
  return 'fa-file-lines';
};

export const fechaDrive = (item: DriveItem): string => {
  if (!item.modifiedTime) return '—';
  const fecha = new Date(item.modifiedTime);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const pesoDrive = (item: DriveItem): string => {
  if (item.isFolder || !item.size) return '—';
  if (item.size < 1024) return `${item.size} B`;
  if (item.size < 1024 * 1024) return `${Math.round(item.size / 1024)} KB`;
  return `${(item.size / (1024 * 1024)).toFixed(1)} MB`;
};
