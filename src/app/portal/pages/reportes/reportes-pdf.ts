import { jsPDF } from 'jspdf';
import { ReporteRegistro } from './reportes.interface';

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;
const RED = '#b91828';
const INK = '#1c1f3a';

const COLS = [
  { key: 'empleado', label: 'Empleado', w: 38 },
  { key: 'fecha', label: 'Fecha', w: 24 },
  { key: 'hora', label: 'Hora', w: 16 },
  { key: 'tipo', label: 'Tipo', w: 24 },
  { key: 'accion', label: 'Acción', w: 46 },
  { key: 'modulo', label: 'Módulo', w: 36 },
  { key: 'estado', label: 'Estado', w: 24 },
  { key: 'detalle', label: 'Detalle', w: 65 }
];

export interface ReportePdfOpciones {
  alcance: string;
  desde: string;
  hasta: string;
  registros: ReporteRegistro[];
}

export function descargarReportePdf(opciones: ReportePdfOpciones): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const registros = [...opciones.registros].sort(compararRegistros);
  let y = dibujarEncabezado(doc, opciones, registros.length);

  registros.forEach((item) => {
    const celdas = [
      item.nombre?.trim() || item.user || item.documento || '-',
      item.fechaDeRegistro || '-',
      item.horaRegistro || '-',
      item.tipo === 'asistencia' ? 'Asistencia' : 'Acción',
      item.accionRealizada || '-',
      item.moduloModificacion || '-',
      item.estado || '-',
      item.detalle || item.resultadoModificacion || '-'
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lineas = celdas.map((texto, i) => doc.splitTextToSize(texto, COLS[i].w - 3));
    const alto = Math.max(7, ...lineas.map((l) => l.length * 4)) + 2;
    if (y + alto > PAGE_H - 12) {
      doc.addPage();
      y = dibujarEncabezado(doc, opciones, registros.length, true);
    }
    doc.setDrawColor(230, 232, 236);
    doc.line(MARGIN, y + alto, PAGE_W - MARGIN, y + alto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(INK);
    let x = MARGIN;
    lineas.forEach((lineasCelda, i) => {
      doc.text(lineasCelda, x + 1.5, y + 4.5);
      x += COLS[i].w;
    });
    y += alto;
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${pages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  }

  const slug = opciones.alcance.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  doc.save(`reporte-${slug || 'personal'}-${opciones.desde}-a-${opciones.hasta}.pdf`);
}

function dibujarEncabezado(
  doc: jsPDF,
  opciones: ReportePdfOpciones,
  total: number,
  continuacion = false
): number {
  doc.setFillColor(RED);
  doc.rect(0, 0, PAGE_W, 16, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Mogensen Montenegro', MARGIN, 10);
  doc.setFontSize(10);
  doc.text('Reporte de actividad', PAGE_W - MARGIN, 10, { align: 'right' });

  doc.setTextColor(INK);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const meta = continuacion
    ? `Continuación · ${opciones.alcance} · ${fmt(opciones.desde)} al ${fmt(opciones.hasta)}`
    : `${opciones.alcance} · ${fmt(opciones.desde)} al ${fmt(opciones.hasta)} · ${total} registro${total === 1 ? '' : 's'}`;
  doc.text(meta, MARGIN, 23);

  let x = MARGIN;
  const y = 30;
  doc.setFillColor(252, 232, 234);
  doc.rect(MARGIN, y - 4.5, PAGE_W - MARGIN * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(RED);
  COLS.forEach((col) => {
    doc.text(col.label, x + 1.5, y);
    x += col.w;
  });
  return y + 6;
}

function fmt(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

function compararRegistros(a: ReporteRegistro, b: ReporteRegistro): number {
  const nombre = (a.nombre || '').localeCompare(b.nombre || '', 'es');
  if (nombre !== 0) return nombre;
  const fechaA = a.registradoEnISO ? new Date(a.registradoEnISO).getTime() : 0;
  const fechaB = b.registradoEnISO ? new Date(b.registradoEnISO).getTime() : 0;
  return fechaA - fechaB;
}
