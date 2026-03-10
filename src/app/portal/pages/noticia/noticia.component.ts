import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Noticia } from '../../../core/noticia/noticia.interface';
import { NoticiaService } from '../../../core/noticia/noticia.service';

@Component({
  selector: 'app-noticia',
  templateUrl: './noticia.component.html',
  styleUrls: ['./noticia.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NoticiaComponent implements OnInit {
  private static readonly MAX_IMAGENES = 5;
  noticias: Noticia[] = [];
  editingId: string | null = null;
  form: { titulo: string; texto: string; imagenesBase64: string[] } = {
    titulo: '',
    texto: '',
    imagenesBase64: []
  };
  error = '';

  constructor(private noticiaService: NoticiaService) {}

  ngOnInit(): void {
    this.cargarLista();
  }

  cargarLista(): void {
    this.noticiaService.getAll().subscribe((list) => (this.noticias = list));
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    if (this.form.imagenesBase64.length + files.length > NoticiaComponent.MAX_IMAGENES) {
      this.error = `Podés cargar hasta ${NoticiaComponent.MAX_IMAGENES} imágenes por publicación.`;
      input.value = '';
      return;
    }
    this.error = '';
    let pendientes = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (this.form.imagenesBase64.length + pendientes.length > NoticiaComponent.MAX_IMAGENES) {
      pendientes = pendientes.slice(0, NoticiaComponent.MAX_IMAGENES - this.form.imagenesBase64.length);
    }
    pendientes.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        this.form.imagenesBase64 = [...this.form.imagenesBase64, data];
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  quitarImagen(index: number): void {
    this.form.imagenesBase64 = this.form.imagenesBase64.filter((_, i) => i !== index);
  }

  guardar(): void {
    if (!this.form.titulo?.trim()) {
      this.error = 'El título es obligatorio.';
      return;
    }
    if (!this.form.imagenesBase64?.length) {
      this.error = 'Cargá al menos una imagen.';
      return;
    }
    this.error = '';
    const payload = {
      imagenesBase64: this.form.imagenesBase64,
      titulo: this.form.titulo.trim(),
      texto: this.form.texto?.trim() ?? ''
    };
    if (this.editingId) {
      this.noticiaService.update(this.editingId, payload).subscribe({
        next: () => {
          this.editingId = null;
          Swal.fire({
            icon: 'success',
            title: 'Noticia actualizada',
            text: 'La noticia se guardó correctamente.',
            confirmButtonColor: '#c60f17'
          });
          this.limpiarForm();
          this.cargarLista();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.message || 'No se pudo actualizar la noticia.',
            confirmButtonColor: '#c60f17'
          });
        }
      });
    } else {
      this.noticiaService.add({ ...payload, activa: true }).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Noticia agregada',
            text: 'La noticia se cargó de forma satisfactoria.',
            confirmButtonColor: '#c60f17'
          });
          this.limpiarForm();
          this.cargarLista();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.message || 'No se pudo guardar la noticia. Revisá que el backend esté levantado y que las imágenes no sean demasiado grandes.',
            confirmButtonColor: '#c60f17'
          });
        }
      });
    }
  }

  editar(n: Noticia): void {
    this.editingId = n.id;
    this.form = {
      titulo: n.titulo,
      texto: n.texto,
      imagenesBase64: n.imagenesBase64 ? [...n.imagenesBase64] : []
    };
    this.error = '';
  }

  eliminar(n: Noticia): void {
    if (confirm(`¿Eliminar la noticia "${n.titulo}"?`)) {
      this.noticiaService.remove(n.id).subscribe({
        next: () => {
          if (this.editingId === n.id) this.limpiarForm();
          this.cargarLista();
        },
        error: () => this.cargarLista()
      });
    }
  }

  toggleActiva(n: Noticia): void {
    this.noticiaService.update(n.id, { activa: !n.activa }).subscribe({
      next: () => this.cargarLista(),
      error: () => this.cargarLista()
    });
  }

  cancelar(): void {
    this.limpiarForm();
  }

  private limpiarForm(): void {
    this.editingId = null;
    this.form = {
      titulo: '',
      texto: '',
      imagenesBase64: []
    };
    this.error = '';
  }
}
