/** Una fila del Excel (una póliza/ítem) */
export interface FilaReciboExcel {
  asegurado: string;
  poliza: string;
  cuit: string;
  compania: string;
  riesgo: string;
  cuota: string;
  efectivo: number;
  debito: number;
  vencimiento: string;
}

/** Un ítem dentro del recibo (fila de la tabla de concepto) */
export interface ItemRecibo {
  poliza: string;
  riesgo: string;
  cuota: string;
  efectivo: number;
  debito: number;
  vencimiento: string;
}

/** Recibo agrupado por asegurado: un PDF por asegurado con N ítems */
export interface ReciboAsegurado {
  asegurado: string;
  cuit: string;
  items: ItemRecibo[];
  total: number; // suma de efectivo + debito de todos los items
}

/** Parsea valor monetario argentino ej: "$88.665,38" o "4399,36" */
export function parseImporteArgentino(val: unknown): number {
  if (val == null || val === '') return 0;
  const s = String(val).trim().replace(/\$/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** Normaliza nombre de columna para matchear con el Excel */
export function normalizarNombreColumna(name: string): string {
  return String(name || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/Ñ/g, 'N');
}
