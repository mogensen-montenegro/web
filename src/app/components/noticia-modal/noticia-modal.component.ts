import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Noticia } from '../../core/noticia/noticia.interface';
import { NoticiaService } from '../../core/noticia/noticia.service';

const RUTAS_PARA_MODAL = ['/home', '/productos', '/servicios', '/contacto', '/nosotros'];

@Component({
  selector: 'app-noticia-modal',
  templateUrl: './noticia-modal.component.html',
  styleUrls: ['./noticia-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class NoticiaModalComponent implements OnInit, OnDestroy {
  visible = false;
  noticia: Noticia | null = null;
  indiceImagenActual = 0;
  /** Si se abrió desde un click en la página Noticias, no marcar como "visto" al cerrar. */
  private manualOpen = false;
  private sub: any;
  private subAbierto: any;

  constructor(
    private noticiaService: NoticiaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.revisarRuta(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.revisarRuta(e.urlAfterRedirects || e.url));
    this.subAbierto = this.noticiaService.getAbrirModal$().subscribe((noticia) => {
      this.noticia = noticia;
      this.indiceImagenActual = 0;
      this.manualOpen = true;
      this.visible = true;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.subAbierto) this.subAbierto.unsubscribe();
  }

  private revisarRuta(url: string): void {
    const path = url.split('?')[0];
    const rutaBase = path.endsWith('/') ? path.slice(0, -1) : path;
    if (!RUTAS_PARA_MODAL.includes(rutaBase)) return;
    if (this.visible) return;
    this.noticiaService.getFirstActiveForModal().subscribe((primera) => {
      if (primera) {
        this.noticia = primera;
        this.indiceImagenActual = 0;
        this.visible = true;
      }
    });
  }

  cerrar(): void {
    if (!this.manualOpen && this.noticia) {
      this.noticiaService.markAsShownToUser(this.noticia.id);
    }
    this.visible = false;
    this.noticia = null;
    this.indiceImagenActual = 0;
    this.manualOpen = false;
  }

  getImagenes(n: Noticia): string[] {
    return n?.imagenesBase64?.length ? n.imagenesBase64 : [];
  }

  anterior(): void {
    const imagenes = this.noticia ? this.getImagenes(this.noticia) : [];
    if (imagenes.length <= 1) return;
    this.indiceImagenActual = this.indiceImagenActual <= 0 ? imagenes.length - 1 : this.indiceImagenActual - 1;
  }

  siguiente(): void {
    const imagenes = this.noticia ? this.getImagenes(this.noticia) : [];
    if (imagenes.length <= 1) return;
    this.indiceImagenActual = this.indiceImagenActual >= imagenes.length - 1 ? 0 : this.indiceImagenActual + 1;
  }

  seleccionarImagen(index: number): void {
    this.indiceImagenActual = index;
  }
}
