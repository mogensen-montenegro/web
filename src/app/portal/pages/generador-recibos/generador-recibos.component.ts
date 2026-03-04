import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FilaReciboExcel,
  normalizarNombreColumna,
  parseImporteArgentino,
  ReciboAsegurado
} from './recibo-excel.interface';
import { generarPdfRecibos } from './generador-pdf.service';
import * as XLSX from 'xlsx';

const COLUMNAS_EXCEL = [
  'ASEGURADO',
  'POLIZA',
  'CUIT',
  'COMPANIA',
  'RIESGO',
  'CUOTA',
  'EFECTIVO',
  'DEBITO',
  'VENCIMIENTO'
] as const;

@Component({
  selector: 'app-generador-recibos',
  templateUrl: './generador-recibos.component.html',
  styleUrls: ['./generador-recibos.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class GeneradorRecibosComponent {
  archivoNombre = '';
  procesando = false;
  error = '';
  pdfGenerado: Blob | null = null;
  cantidadRecibos = 0;
  logoBase64 = '';
  iconoTelefonoBase64 = '';
  iconoSitioWebBase64 = '';
  firmaBase64 = '';

  private readonly logoPath = 'assets/img/logoMongensen.jpg';
  private readonly iconoTelefonoPath = 'assets/img/telefono-movil.png';
  private readonly iconoSitioWebPath = 'assets/img/sitio-web.png';
  private readonly firmaPath = 'assets/img/firma.png';
  private readonly excelBasePaths = ['assets/xlsx/excelBase.xlsx', 'assets/excelBase.xlsx'];

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.error = '';
    this.pdfGenerado = null;
    this.cantidadRecibos = 0;
    if (!file) return;
    const nombre = file.name.toLowerCase();
    if (!nombre.endsWith('.xlsx') && !nombre.endsWith('.xls')) {
      this.error = 'El archivo debe ser Excel (.xlsx o .xls).';
      input.value = '';
      return;
    }
    this.archivoNombre = file.name;
    this.procesarExcel(file);
  }

  private async procesarExcel(file: File): Promise<void> {
    this.procesando = true;
    try {
      const filas = await this.leerExcel(file);
      if (filas.length === 0) {
        this.error =
          'No se encontraron filas de datos. Encabezados esperados: ASEGURADO, PÓLIZA, CUIT, COMPAÑÍA, RIESGO, CUOTA, EFECTIVO, DEBITO, VENCIMIENTO.';
        this.procesando = false;
        return;
      }
      const recibosPorAsegurado = this.agruparPorAsegurado(filas);
      if (recibosPorAsegurado.length === 0) {
        this.error = 'No se pudo agrupar ningún recibo por asegurado.';
        this.procesando = false;
        return;
      }
      const [logo, iconPhone, iconWeb, firma] = await Promise.all([
        this.cargarImagenBase64(this.logoPath),
        this.cargarImagenBase64(this.iconoTelefonoPath),
        this.cargarImagenBase64(this.iconoSitioWebPath),
        this.cargarImagenBase64(this.firmaPath)
      ]);
      const ahora = new Date();
      const fechaEmision = this.formatearFecha(ahora);
      const numeroReciboBase = this.formatearNumeroRecibo(ahora);
      const blob = await generarPdfRecibos(
        recibosPorAsegurado,
        logo,
        iconPhone,
        iconWeb,
        firma,
        numeroReciboBase,
        fechaEmision
      );
      this.pdfGenerado = blob;
      this.cantidadRecibos = recibosPorAsegurado.length;
      this.error = '';
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Error al procesar el archivo.';
      this.pdfGenerado = null;
    } finally {
      this.procesando = false;
    }
  }

  private encontrarFilaEncabezado(raw: unknown[][]): number {
    for (let r = 0; r < Math.min(10, raw.length); r++) {
      const row = raw[r] ?? [];
      const normalizados = (row as unknown[]).map((c) => normalizarNombreColumna(String(c ?? '')));
      if (normalizados.includes('ASEGURADO')) return r;
    }
    return 0;
  }

  private mapearIndicesColumnas(headerRow: string[]): Record<string, number> {
    const indices: Record<string, number> = {};
    const alternativas: Record<string, string[]> = {
      POLIZA: ['PÓLIZA', 'POLIZA'],
      COMPANIA: ['COMPAÑÍA', 'COMPANÍA', 'COMPANIA'],
      RIESGO: ['RIESGO'],
      CUOTA: ['CUOTA'],
      EFECTIVO: ['EFECTIVO'],
      DEBITO: ['DÉBITO', 'DEBITO'],
      VENCIMIENTO: ['VENCIMIENTO', 'VENCIMIENTOS']
    };
    for (const col of COLUMNAS_EXCEL) {
      let idx = headerRow.indexOf(col);
      if (idx === -1 && alternativas[col]) {
        for (const alt of alternativas[col]) {
          idx = headerRow.indexOf(normalizarNombreColumna(alt));
          if (idx !== -1) break;
        }
      }
      if (idx === -1) {
        for (let j = 0; j < headerRow.length; j++) {
          const h = (headerRow[j] || '').trim();
          if (h === col || (alternativas[col] && alternativas[col].some((a) => normalizarNombreColumna(a) === h))) {
            idx = j;
            break;
          }
        }
      }
      if (idx !== -1) indices[col] = idx;
    }
    return indices;
  }

  private obtenerCelda(row: unknown[], index: number | undefined): string {
    if (index === undefined) return '';
    const val = row[index];
    return val != null ? String(val).trim() : '';
  }

  private agruparPorAsegurado(filas: FilaReciboExcel[]): ReciboAsegurado[] {
    const map = new Map<string, ReciboAsegurado>();
    for (const f of filas) {
      const key = `${(f.asegurado || '').trim()}|${(f.cuit || '').trim()}`;
      if (!key || key === '|') continue;
      const item = {
        poliza: f.poliza || '',
        riesgo: f.riesgo || '',
        cuota: f.cuota || '',
        efectivo: f.efectivo,
        debito: f.debito,
        vencimiento: f.vencimiento || ''
      };
      if (!map.has(key)) {
        map.set(key, {
          asegurado: (f.asegurado || '').trim(),
          cuit: (f.cuit || '').trim(),
          items: [],
          total: 0
        });
      }
      const rec = map.get(key)!;
      rec.items.push(item);
      rec.total += item.efectivo + item.debito;
    }
    return Array.from(map.values());
  }

  private leerExcel(file: File): Promise<FilaReciboExcel[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array((e.target as FileReader).result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const sheet = wb.Sheets[firstSheetName];
          const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
          if (!raw.length) {
            resolve([]);
            return;
          }
          const headerRowIndex = this.encontrarFilaEncabezado(raw);
          const headerRow = (raw[headerRowIndex] ?? []).map((c) => normalizarNombreColumna(String(c ?? '')));
          const indices = this.mapearIndicesColumnas(headerRow);
          if (indices['ASEGURADO'] === undefined) {
            resolve([]);
            return;
          }
          const filas: FilaReciboExcel[] = [];
          for (let i = headerRowIndex + 1; i < raw.length; i++) {
            const row = raw[i] as unknown[] | undefined;
            if (!row || !Array.isArray(row)) continue;
            const cuotaVal = indices['CUOTA'] !== undefined ? row[indices['CUOTA']] : undefined;
            if (cuotaVal != null && String(cuotaVal).toUpperCase().trim() === 'TOTAL') continue;
            const asegurado = indices['ASEGURADO'] !== undefined && row[indices['ASEGURADO']] != null
              ? String(row[indices['ASEGURADO']]).trim()
              : '';
            if (!asegurado) continue;
            filas.push({
              asegurado,
              poliza: this.obtenerCelda(row, indices['POLIZA']),
              cuit: this.obtenerCelda(row, indices['CUIT']),
              compania: this.obtenerCelda(row, indices['COMPANIA']),
              riesgo: this.obtenerCelda(row, indices['RIESGO']),
              cuota: this.obtenerCelda(row, indices['CUOTA']),
              efectivo: parseImporteArgentino(indices['EFECTIVO'] !== undefined ? row[indices['EFECTIVO']] : undefined),
              debito: parseImporteArgentino(indices['DEBITO'] !== undefined ? row[indices['DEBITO']] : undefined),
              vencimiento: this.obtenerCelda(row, indices['VENCIMIENTO'])
            });
          }
          resolve(filas);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  private cargarImagenBase64(path: string): Promise<string> {
    const cache =
      path === this.logoPath
        ? this.logoBase64
        : path === this.iconoTelefonoPath
          ? this.iconoTelefonoBase64
          : path === this.iconoSitioWebPath
            ? this.iconoSitioWebBase64
            : this.firmaBase64;
    if (cache) return Promise.resolve(cache);
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    const fullPath = baseHref.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
    const url = fullPath.startsWith('http') ? fullPath : window.location.origin + fullPath;
    return fetch(url)
      .then((r) => {
        if (!r.ok) return null;
        return r.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            if (!blob) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Error al convertir imagen'));
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => {
        if (path === this.logoPath) this.logoBase64 = dataUrl;
        else if (path === this.iconoTelefonoPath) this.iconoTelefonoBase64 = dataUrl;
        else if (path === this.iconoSitioWebPath) this.iconoSitioWebBase64 = dataUrl;
        else if (path === this.firmaPath) this.firmaBase64 = dataUrl;
        return dataUrl;
      });
  }

  private formatearFecha(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /** Número de recibo base: DDMMYYYYHHmm (ej: 030320262146) para que sea único por fecha y hora */
  private formatearNumeroRecibo(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}${month}${year}${hour}${min}`;
  }

  descargarPdf(): void {
    if (!this.pdfGenerado) return;
    const url = URL.createObjectURL(this.pdfGenerado);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibos-mogensen-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  descargarExcelBase(): void {
    this.error = '';
    const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    const base = baseHref.replace(/\/$/, '');
    const origin = window.location.origin;
    const tryFetch = (index: number): void => {
      if (index >= this.excelBasePaths.length) {
        this.error = 'No se encontró el archivo Excel base. Colocá excelBase.xlsx en src/assets/xlsx/ o en src/assets/ y reiniciá el servidor (ng serve) si hace falta.';
        return;
      }
      const relPath = this.excelBasePaths[index].replace(/^\//, '');
      const path = base ? base + '/' + relPath : '/' + relPath;
      const url = (path.startsWith('http') ? path : origin + path) + '?t=' + Date.now();
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error('Not found');
          const contentType = (r.headers.get('Content-Type') || '').toLowerCase();
          if (contentType.includes('text/html')) {
            throw new Error('El servidor devolvió HTML en lugar del Excel (revisá la ruta del archivo).');
          }
          return r.arrayBuffer();
        })
        .then((buffer) => {
          const blob = new Blob([buffer], { type: MIME_XLSX });
          const u = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = u;
          a.download = 'excelBase.xlsx';
          a.click();
          URL.revokeObjectURL(u);
        })
        .catch(() => tryFetch(index + 1));
    };
    tryFetch(0);
  }
}
