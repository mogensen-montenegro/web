import { jsPDF } from 'jspdf';
import { ReciboAsegurado } from './recibo-excel.interface';
import { numeroAPalabras } from './numero-a-palabras.util';

const RED_PRIMARY = '#c60f17';
const GREY_DARK = '#4a4a4a';
const GREY_LIGHT = '#e8e8e8';
const PAGE_W = 210;
const MARGIN = 15;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const FONT_SERIF = 'times';

const CONTACTO = {
  segurosGenerales: '+549 (011)-6477-8878',
  ahorroRetiro: '+549 (011)-7654-9506',
  vidaArt: '+549 (011)-4528-0955',
  email: 'mogensenmontenegroseguros@gmail.com'
};

function formatMoneda(n: number): string {
  return (
    '$ ' +
    n
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

function formatCuota(cuota: string): string {
  const s = String(cuota || '').trim();
  if (!s) return '';
  return s.replace(/\s*-\s*\/\s*/g, '/').replace(/-\//g, '/');
}

export async function generarPdfRecibos(
  recibos: ReciboAsegurado[],
  logoBase64: string,
  iconoTelefonoBase64: string,
  iconoSitioWebBase64: string,
  firmaBase64: string,
  numeroReciboBase: string,
  fechaEmision: string
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  for (let i = 0; i < recibos.length; i++) {
    if (i > 0) doc.addPage();
    const numeroRecibo = numeroReciboBase + String(i + 1).padStart(2, '0');
    dibujarRecibo(
      doc,
      recibos[i],
      logoBase64,
      iconoTelefonoBase64,
      iconoSitioWebBase64,
      firmaBase64,
      numeroRecibo,
      fechaEmision
    );
  }

  return doc.output('blob');
}

function dibujarRecibo(
  doc: jsPDF,
  recibo: ReciboAsegurado,
  logoBase64: string,
  iconoTelefonoBase64: string,
  iconoSitioWebBase64: string,
  firmaBase64: string,
  nroRecibo: string,
  fechaEmision: string
): void {
  let y = MARGIN;

  const logoW = 50;
  const logoH = 18;
  const contactX = MARGIN + logoW + 4;
  const iconSize = 4;
  const lineH = 5;
  const textOffset = iconSize + 3;

  try {
    doc.addImage(logoBase64, 'JPEG', MARGIN, y, logoW, logoH);
  } catch {
    doc.setFillColor(220, 220, 220);
    doc.rect(MARGIN, y, logoW, logoH, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Logo', MARGIN + logoW / 2 - 5, y + logoH / 2 - 2);
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(8);
  doc.setFont(FONT_SERIF, 'normal');
  doc.setTextColor(GREY_DARK);

  let contactY = y + 4;
  if (iconoTelefonoBase64) {
    try {
      doc.addImage(iconoTelefonoBase64, 'PNG', contactX, contactY - 3, iconSize, iconSize);
    } catch {
      // ignorar
    }
  }
  doc.text(`Seg. Generales: ${CONTACTO.segurosGenerales}`, contactX + textOffset, contactY);
  contactY += lineH;

  if (iconoTelefonoBase64) {
    try {
      doc.addImage(iconoTelefonoBase64, 'PNG', contactX, contactY - 3, iconSize, iconSize);
    } catch {
      // ignorar
    }
  }
  doc.text(`Ahorro y Retiro: ${CONTACTO.ahorroRetiro}`, contactX + textOffset, contactY);
  contactY += lineH;

  if (iconoTelefonoBase64) {
    try {
      doc.addImage(iconoTelefonoBase64, 'PNG', contactX, contactY - 3, iconSize, iconSize);
    } catch {
      // ignorar
    }
  }
  doc.text(`Vida/ART: ${CONTACTO.vidaArt}`, contactX + textOffset, contactY);
  contactY += lineH;

  if (iconoSitioWebBase64) {
    try {
      doc.addImage(iconoSitioWebBase64, 'PNG', contactX, contactY - 3, iconSize, iconSize);
    } catch {
      // ignorar
    }
  }
  doc.text(CONTACTO.email, contactX + textOffset, contactY);
  y += 28;

  // Banda gris solo con N.º recibo y Fecha a la derecha
  const reciboW = 32;
  const fechaW = 38;
  const rightStart = PAGE_W - MARGIN - reciboW - fechaW - 4;
  const bandH = 10;

  doc.setFillColor(GREY_DARK);
  doc.rect(MARGIN, y, CONTENT_W, bandH, 'F');
  doc.setFillColor(RED_PRIMARY);
  doc.rect(rightStart, y, reciboW, bandH / 2, 'F');
  doc.rect(rightStart + reciboW + 2, y, fechaW, bandH / 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_SERIF, 'bold');
  doc.setFontSize(8);
  doc.text('N.º recibo', rightStart + 2, y + 4);
  doc.text('Fecha Emisión', rightStart + reciboW + 4, y + 4);
  doc.setFillColor(255, 255, 255);
  doc.rect(rightStart, y + bandH / 2, reciboW, bandH / 2, 'F');
  doc.rect(rightStart + reciboW + 2, y + bandH / 2, fechaW, bandH / 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT_SERIF, 'normal');
  doc.setFontSize(9);
  doc.text(nroRecibo, rightStart + 2, y + 8.5);
  doc.text(fechaEmision, rightStart + reciboW + 4, y + 8.5);
  y += bandH + 4;

  // Tabla: Recibí de / CUIT / La suma de
  const rowH = 10;
  const labelW = 45;
  const valueW = CONTENT_W - labelW;

  const recibidoDe = (recibo.asegurado || '').trim().toUpperCase() || '-';
  const cuitStr = (recibo.cuit || '').trim() || '-';
  const total = recibo.total;
  const sumaPalabras = numeroAPalabras(total);
  const lineasSuma = doc.splitTextToSize(sumaPalabras, valueW - 4);
  const lineHeightSuma = 5.5;
  const rowHSuma = Math.max(16, 8 + lineasSuma.length * lineHeightSuma);

  doc.setFillColor(255, 255, 255);
  doc.rect(MARGIN, y, labelW, rowH, 'F');
  doc.rect(MARGIN + labelW, y, valueW, rowH, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(MARGIN, y, CONTENT_W, rowH, 'S');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text('Recibí de:', MARGIN + 3, y + 6.5);
  doc.setFillColor(GREY_LIGHT);
  doc.rect(MARGIN + labelW, y, valueW, rowH, 'F');
  doc.text(doc.splitTextToSize(recibidoDe, valueW - 4)[0] || recibidoDe, MARGIN + labelW + 3, y + 6.5);
  y += rowH;

  doc.setFillColor(RED_PRIMARY);
  doc.rect(MARGIN, y, labelW, rowH, 'F');
  doc.setFillColor(GREY_LIGHT);
  doc.rect(MARGIN + labelW, y, valueW, rowH, 'F');
  doc.rect(MARGIN, y, CONTENT_W, rowH, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_SERIF, 'bold');
  doc.text('DNI/NIF/CUIT/', MARGIN + 3, y + 6.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT_SERIF, 'normal');
  doc.text(cuitStr, MARGIN + labelW + 3, y + 6.5);
  y += rowH;

  doc.setFillColor(255, 255, 255);
  doc.rect(MARGIN, y, labelW, rowHSuma, 'F');
  doc.setFillColor(GREY_LIGHT);
  doc.rect(MARGIN + labelW, y, valueW, rowHSuma, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(MARGIN, y, CONTENT_W, rowHSuma, 'S');
  doc.setTextColor(0, 0, 0);
  doc.text('La suma de:', MARGIN + 3, y + 6.5);
  let textY = y + 6;
  for (let i = 0; i < lineasSuma.length; i++) {
    doc.text(lineasSuma[i], MARGIN + labelW + 3, textY);
    textY += lineHeightSuma;
  }
  y += rowHSuma + 4;

  // Como pago por concepto de: tabla con Nº póliza, Riesgo, Cuota, Efectivo/Débito, Vencimiento
  const conceptoH = 8;
  doc.setFillColor(RED_PRIMARY);
  doc.rect(MARGIN, y, CONTENT_W, conceptoH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_SERIF, 'bold');
  doc.setFontSize(10);
  doc.text('Como pago por concepto de:', MARGIN + CONTENT_W / 2, y + 5.5, { align: 'center' });
  y += conceptoH + 2;

  const colW = {
    poliza: 38,
    riesgo: 28,
    cuota: 22,
    efectivoDebito: 50,
    vencimiento: 42
  };
  const headerH = 8;
  doc.setFillColor(RED_PRIMARY);
  doc.rect(MARGIN, y, colW.poliza, headerH, 'F');
  doc.rect(MARGIN + colW.poliza, y, colW.riesgo, headerH, 'F');
  doc.rect(MARGIN + colW.poliza + colW.riesgo, y, colW.cuota, headerH, 'F');
  doc.rect(MARGIN + colW.poliza + colW.riesgo + colW.cuota, y, colW.efectivoDebito, headerH, 'F');
  doc.rect(MARGIN + colW.poliza + colW.riesgo + colW.cuota + colW.efectivoDebito, y, colW.vencimiento, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_SERIF, 'bold');
  doc.setFontSize(8);
  doc.text('Nº póliza', MARGIN + 2, y + 5.5);
  doc.text('Riesgo', MARGIN + colW.poliza + 2, y + 5.5);
  doc.text('Cuota', MARGIN + colW.poliza + colW.riesgo + 2, y + 5.5);
  doc.text('Efectivo/Débito', MARGIN + colW.poliza + colW.riesgo + colW.cuota + 2, y + 5.5);
  doc.text('Vencimiento', MARGIN + colW.poliza + colW.riesgo + colW.cuota + colW.efectivoDebito + 2, y + 5.5);
  y += headerH;

  const dataRowH = 7;
  doc.setFont(FONT_SERIF, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  for (const item of recibo.items) {
    doc.setDrawColor(200, 200, 200);
    doc.rect(MARGIN, y, colW.poliza, dataRowH, 'S');
    doc.rect(MARGIN + colW.poliza, y, colW.riesgo, dataRowH, 'S');
    doc.rect(MARGIN + colW.poliza + colW.riesgo, y, colW.cuota, dataRowH, 'S');
    doc.rect(MARGIN + colW.poliza + colW.riesgo + colW.cuota, y, colW.efectivoDebito, dataRowH, 'S');
    doc.rect(MARGIN + colW.poliza + colW.riesgo + colW.cuota + colW.efectivoDebito, y, colW.vencimiento, dataRowH, 'S');
    doc.setFillColor(GREY_LIGHT);
    doc.rect(MARGIN + 1, y + 1, colW.poliza - 2, dataRowH - 2, 'F');
    doc.rect(MARGIN + colW.poliza + 1, y + 1, colW.riesgo - 2, dataRowH - 2, 'F');
    doc.rect(MARGIN + colW.poliza + colW.riesgo + 1, y + 1, colW.cuota - 2, dataRowH - 2, 'F');
    doc.rect(MARGIN + colW.poliza + colW.riesgo + colW.cuota + 1, y + 1, colW.efectivoDebito - 2, dataRowH - 2, 'F');
    doc.rect(MARGIN + colW.poliza + colW.riesgo + colW.cuota + colW.efectivoDebito + 1, y + 1, colW.vencimiento - 2, dataRowH - 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text((item.poliza || '-').substring(0, 14), MARGIN + 2, y + 4.5);
    doc.text((item.riesgo || '-').substring(0, 10), MARGIN + colW.poliza + 2, y + 4.5);
    doc.text(formatCuota(item.cuota).substring(0, 8), MARGIN + colW.poliza + colW.riesgo + 2, y + 4.5);
    const efDeb =
      item.efectivo > 0 && item.debito > 0
        ? `Efectivo ${formatMoneda(item.efectivo)} / Débito ${formatMoneda(item.debito)}`
        : item.efectivo > 0
          ? `Efectivo ${formatMoneda(item.efectivo)}`
          : `Débito ${formatMoneda(item.debito)}`;
    doc.text(doc.splitTextToSize(efDeb, colW.efectivoDebito - 4)[0] || efDeb, MARGIN + colW.poliza + colW.riesgo + colW.cuota + 2, y + 4.5);
    doc.text((item.vencimiento || '-').substring(0, 12), MARGIN + colW.poliza + colW.riesgo + colW.cuota + colW.efectivoDebito + 2, y + 4.5);
    y += dataRowH;
  }
  y += 6;

  // Pie: firma (izq) y total (der) — fijo abajo en A4
  const footerY = 297 - MARGIN - 32;
  const firmaW = 55;
  const firmaH = 28;
  if (firmaBase64) {
    try {
      doc.addImage(firmaBase64, 'PNG', MARGIN, footerY, firmaW, firmaH);
    } catch {
      doc.setFont(FONT_SERIF, 'italic');
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text('Mogensen Gabriela', MARGIN + 5, footerY + firmaH / 2);
    }
  } else {
    doc.setFont(FONT_SERIF, 'italic');
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('Mogensen Gabriela', MARGIN + 5, footerY + firmaH / 2);
  }

  const totalBoxW = 45;
  const totalBoxX = PAGE_W - MARGIN - totalBoxW;
  doc.setFillColor(RED_PRIMARY);
  doc.rect(totalBoxX, footerY, totalBoxW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_SERIF, 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', totalBoxX + totalBoxW / 2, footerY + 7, { align: 'center' });
  doc.setFillColor(GREY_LIGHT);
  doc.rect(totalBoxX, footerY + 10, totalBoxW, 18, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT_SERIF, 'normal');
  doc.setFontSize(11);
  doc.text(formatMoneda(total), totalBoxX + totalBoxW / 2, footerY + 22, { align: 'center' });
}
