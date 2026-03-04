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

/**
 * Parsea valor monetario: número (Excel) o string en formato argentino.
 * - Si ya es número (ej: 7023.79), se usa tal cual (los centavos se preservan).
 * - Si es string "7023,79" o "$ 7.023,79": coma = decimal, punto = miles.
 */
export function parseImporteArgentino(val: unknown): number {
  if (val == null || val === '') return 0;
  if (typeof val === 'number' && !isNaN(val)) return Math.round(val * 100) / 100;
  const s = String(val).trim().replace(/\$/g, '').trim();
  if (!s) return 0;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let numStr: string;
  if (hasComma && hasDot) {
    numStr = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    numStr = s.replace(',', '.');
  } else if (hasDot) {
    numStr = s;
  } else {
    numStr = s;
  }
  const n = parseFloat(numStr);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
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
