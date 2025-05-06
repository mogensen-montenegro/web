import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports:[CommonModule, RouterModule]
})
export class HeaderComponent implements OnDestroy{
  @Input() isHeader: boolean = true;

  @ViewChild( 'menuBtn' ) menuBtn: ElementRef | undefined;
  @ViewChild( 'menuDesplegado' ) menuDesplegado: ElementRef | undefined;
  @ViewChild('tamanoCaja') tamanoCaja: ElementRef | undefined ;

  public abiertoMenu: boolean = true;

  private destroy$: Subject<void> = new Subject();

  constructor(private render2: Renderer2){}

  public abrirMenu(): void{
    if(this.abiertoMenu == true){
      this.abiertoMenu = false;
      this.render2.addClass(this.menuBtn!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'close');
      return;
    }
    if(this.abiertoMenu == false){
      this.render2.removeClass(this.menuBtn!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'close');
      setTimeout(()=>{
        this.abiertoMenu = true;
      },500)
      return
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

}
