import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlineacionTexto, CeldaHoja, DRIVE_COLORES, DRIVE_FUENTES, PaletaFmt, celdaVacia } from './drive.models';

@Component({
  selector: 'app-drive-word-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drive-word-editor.component.html',
  styleUrls: ['./drive-word-editor.component.scss']
})
export class DriveWordEditorComponent implements OnChanges, AfterViewInit {
  @ViewChild('richEditor') richEditor?: ElementRef<HTMLDivElement>;
  @Input() html = '';
  @Input() puedeEditar = false;
  @Output() htmlChange = new EventEmitter<string>();

  public readonly fuentes = DRIVE_FUENTES;
  public readonly colores = DRIVE_COLORES;
  public paleta: PaletaFmt = null;
  public richFmt: CeldaHoja = { ...celdaVacia(), size: 15 };
  private ignorarCambio = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['html'] && this.richEditor?.nativeElement.innerHTML !== this.html) {
      this.pintar();
    }
  }

  ngAfterViewInit(): void {
    this.pintar();
  }

  @HostListener('document:click', ['$event'])
  public onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.drive-fmt__swatch')) this.paleta = null;
  }

  @HostListener('document:selectionchange')
  public onSelectionChange(): void {
    this.syncRichFmt();
  }

  public getHtml(): string {
    return this.richEditor?.nativeElement.innerHTML || this.html || '';
  }

  public getText(): string {
    return this.richEditor?.nativeElement.innerText || '';
  }

  public aplicarFormato(comando: string): void {
    this.richEditor?.nativeElement.focus();
    const conCss = comando !== 'bold' && comando !== 'italic' && comando !== 'underline';
    document.execCommand('styleWithCSS', false, conCss ? 'true' : 'false');
    document.execCommand(comando, false);
    this.onRichInput();
    this.syncRichFmt();
  }

  public aplicarFuente(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.richFmt.font = value;
    this.richEditor?.nativeElement.focus();
    document.execCommand('fontName', false, value);
    this.onRichInput();
  }

  public aplicarAlineacionRich(align: AlineacionTexto): void {
    const cmd = align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : 'justifyLeft';
    this.richFmt.align = align;
    this.aplicarFormato(cmd);
  }

  public aplicarColorRich(color: string, fill = false): void {
    this.richEditor?.nativeElement.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(fill ? 'hiliteColor' : 'foreColor', false, color);
    if (fill) this.richFmt.fill = color;
    else this.richFmt.color = color;
    this.paleta = null;
    this.onRichInput();
  }

  public cambiarTamanioRich(delta: number): void {
    this.setTamanioRich((this.richFmt.size || 15) + delta);
  }

  public setTamanioRich(value: string | number): void {
    const size = Math.min(72, Math.max(8, Number(value) || 15));
    this.richFmt.size = size;
    this.richEditor?.nativeElement.focus();
    document.execCommand('fontSize', false, '7');
    this.richEditor?.nativeElement.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      while (font.firstChild) span.appendChild(font.firstChild);
      font.parentNode?.replaceChild(span, font);
    });
    this.onRichInput();
  }

  public togglePaleta(tipo: Exclude<PaletaFmt, null>, event: Event): void {
    event.stopPropagation();
    this.paleta = this.paleta === tipo ? null : tipo;
  }

  public onRichInput(): void {
    const html = this.richEditor?.nativeElement.innerHTML || '';
    this.syncRichFmt();
    if (!this.ignorarCambio) this.htmlChange.emit(html);
  }

  public syncRichFmt(): void {
    const root = this.richEditor?.nativeElement;
    const sel = document.getSelection();
    if (!root || !sel || !sel.anchorNode || !root.contains(sel.anchorNode)) return;
    this.richFmt.bold = document.queryCommandState('bold');
    this.richFmt.italic = document.queryCommandState('italic');
    this.richFmt.underline = document.queryCommandState('underline');
    const node = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode.parentElement;
    if (!node) return;
    const cs = window.getComputedStyle(node);
    this.richFmt.font = (cs.fontFamily.split(',')[0] || 'Arial').replace(/['"]/g, '').trim();
    this.richFmt.size = Math.round(parseFloat(cs.fontSize)) || 15;
    this.richFmt.color = this.rgbToHex(cs.color) || this.richFmt.color;
    this.richFmt.align = cs.textAlign === 'center' || cs.textAlign === 'right' ? cs.textAlign : 'left';
    const bg = this.rgbToHex(cs.backgroundColor);
    this.richFmt.fill = bg && bg !== '#ffffff' && bg !== '#000000' ? bg : '';
  }

  public pintar(): void {
    setTimeout(() => {
      const el = this.richEditor?.nativeElement;
      if (!el) {
        setTimeout(() => this.pintar(), 50);
        return;
      }
      this.ignorarCambio = true;
      const html = this.sanitizarHtml(this.html || '');
      if (/<[a-z][\s\S]*>/i.test(html)) {
        el.innerHTML = html || '<p><br></p>';
      } else {
        el.innerHTML = (this.html || '')
          .split('\n')
          .map((line) => `<p>${this.escapeHtml(line) || '<br>'}</p>`)
          .join('');
      }
      setTimeout(() => {
        this.ignorarCambio = false;
      }, 0);
    }, 0);
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private sanitizarHtml(html: string): string {
    return String(html || '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '');
  }

  private rgbToHex(value: string): string {
    const m = String(value || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) {
      const hex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}`;
    }
    if (/^#([0-9a-f]{3})$/i.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
    }
    if (/^#([0-9a-f]{6})$/i.test(value)) return value.toLowerCase();
    return '';
  }
}
