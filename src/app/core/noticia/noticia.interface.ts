export interface Noticia {
  id: string;
  /** Hasta 5 imágenes por publicación. Se mantiene imagenBase64 opcional para compatibilidad con datos antiguos. */
  imagenesBase64: string[];
  titulo: string;
  texto: string;
  activa: boolean;
  /** Ya no se usa; se elimina manualmente. Mantenido opcional por compatibilidad. */
  diasVisibles?: number;
  createdAt: string; // ISO date
}

/** Noticia guardada puede tener imagenBase64 (viejo) o imagenesBase64 (nuevo). */
export interface NoticiaRaw {
  id: string;
  imagenBase64?: string;
  imagenesBase64?: string[];
  titulo: string;
  texto: string;
  activa: boolean;
  diasVisibles?: number;
  createdAt: string;
}
