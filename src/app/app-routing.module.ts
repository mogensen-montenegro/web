import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { ContactoComponent } from './pages/contacto/contacto.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '', component: PagesComponent,
    children: [
       { path: 'home', component: HomeComponent },
       { path: 'productos', component: ProductosComponent },
       { path: 'contacto', component: ContactoComponent },
      // { path: 'terminos', component: TerminosCondicionesComponent },
      // { path: 'politicas', component: PoliticasPrivacidadComponent },
      // { path: 'funcionalidad', component: FuncionalidadComponent },
    ]
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
