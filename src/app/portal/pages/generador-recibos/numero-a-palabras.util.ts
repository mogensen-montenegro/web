/**
 * Convierte un número a su representación en palabras en español (Argentina: pesos y centavos).
 * Ej: 364788.93 -> "TRESCIENTOS SESENTA Y CUATRO MIL SETECIENTOS OCHENTA Y OCHO PESOS CON 93/100"
 */
export function numeroAPalabras(valor: number): string {
  const entero = Math.floor(valor);
  const centavos = Math.round((valor - entero) * 100);
  const parteEntera = enteroAPalabras(entero);
  const strCentavos = centavos.toString().padStart(2, '0');
  return `${parteEntera} PESOS CON ${strCentavos}/100`;
}

const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const ESPECIALES_10_15 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const DECENAS_COMPUESTAS = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function enteroAPalabras(n: number): string {
  if (n === 0) return 'CERO';
  if (n < 0) return 'MENOS ' + enteroAPalabras(-n);
  if (n < 10) return UNIDADES[n];
  if (n < 20) return ESPECIALES_10_15[n - 10] || DECENAS_COMPUESTAS[n - 10] || DECENAS_COMPUESTAS[0];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return DECENAS[d];
    if (d === 2) return 'VEINTI' + UNIDADES[u].toLowerCase();
    return DECENAS[d] + ' Y ' + UNIDADES[u];
  }
  if (n === 100) return 'CIEN';
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (resto === 0) return CENTENAS[c];
    return CENTENAS[c] + ' ' + enteroAPalabras(resto);
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    let parteMiles: string;
    if (miles === 1) parteMiles = 'MIL';
    else parteMiles = enteroAPalabras(miles) + ' MIL';
    if (resto === 0) return parteMiles;
    return parteMiles + ' ' + enteroAPalabras(resto);
  }
  if (n < 1000000000) {
    const millones = Math.floor(n / 1000000);
    const resto = n % 1000000;
    let parteMillones: string;
    if (millones === 1) parteMillones = 'UN MILLÓN';
    else parteMillones = enteroAPalabras(millones) + ' MILLONES';
    if (resto === 0) return parteMillones;
    return parteMillones + ' ' + enteroAPalabras(resto);
  }
  return n.toString();
}
