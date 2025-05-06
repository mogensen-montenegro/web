import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '', component: PagesComponent,
    children: [
       { path: 'home', component: HomeComponent },
      // { path: 'recomendaciones', component: RecomendacionesComponent },
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
