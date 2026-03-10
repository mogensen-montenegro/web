import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonWhatsappComponent } from '../../components/button-whatsapp/button-whatsapp.component';
import { Noticia } from '../../core/noticia/noticia.interface';
import { NoticiaService } from '../../core/noticia/noticia.service';

@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.component.html',
  styleUrls: ['./noticias.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ButtonWhatsappComponent]
})
export class NoticiasComponent implements OnInit {
  noticias: Noticia[] = [];
  loading = true;

  constructor(private noticiaService: NoticiaService) {}

  ngOnInit(): void {
    this.noticiaService.getActive().subscribe({
      next: (list) => {
        this.noticias = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  verNoticia(noticia: Noticia): void {
    this.noticiaService.abrirModalConNoticia(noticia);
  }
}
