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

const redondearCentavos = (n: number): number => Math.round(n * 100) / 100;

/**
 * Parsea importes desde Excel o Google Sheets (formato AR o US).
 * - Número nativo de la planilla: se usa tal cual.
 * - "1.234,56" / "$ 1.234,56" → argentino
 * - "1,234.56" / "$ 1,234.56" → estadounidense (típico al exportar desde Google)
 * - "415,91" → decimal argentino
 * - "415.91" → decimal US / valor Excel
 */
export function parseImporteArgentino(val: unknown): number {
  if (val == null || val === '') return 0;
  if (typeof val === 'number' && !isNaN(val)) return redondearCentavos(val);
  if (typeof val === 'bigint') return redondearCentavos(Number(val));

  let s = String(val).trim();
  if (!s) return 0;
  s = s
    .replace(/\u00a0/g, ' ')
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/^[A-Za-z]{1,3}/, ''); // ARS, USD, etc. al inicio
  if (!s) return 0;

  const negativo = s.startsWith('-') || s.startsWith('(');
  s = s.replace(/[()]/g, '').replace(/^\+/, '');
  if (!s) return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let numStr: string;

  if (hasComma && hasDot) {
    // El separador decimal es el que aparece último.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // AR: 1.234,56
      numStr = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,234.56 (común en Google Sheets)
      numStr = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    const partes = s.split(',');
    const dec = partes[partes.length - 1] || '';
    // "1,234,567" o "1,234" (3 dígitos) → miles US; "415,91" → decimal AR
    if (partes.length > 2 || (partes.length === 2 && dec.length === 3 && /^\d+$/.test(dec))) {
      numStr = s.replace(/,/g, '');
    } else {
      numStr = `${partes[0]}.${dec}`;
    }
  } else if (hasDot) {
    const partes = s.split('.');
    const dec = partes[partes.length - 1] || '';
    // "1.234.567" → miles AR; "1.234" (3 dígitos) → miles AR; "415.91" → decimal
    if (partes.length > 2 || (partes.length === 2 && dec.length === 3 && /^\d+$/.test(dec))) {
      numStr = s.replace(/\./g, '');
    } else {
      numStr = s;
    }
  } else {
    numStr = s;
  }

  const n = parseFloat(numStr);
  if (isNaN(n)) return 0;
  return redondearCentavos(negativo ? -Math.abs(n) : n);
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
