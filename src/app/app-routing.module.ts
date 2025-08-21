import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PagesComponent} from './pages/pages.component';
import {HomeComponent} from './pages/home/home.component';
import {ProductosComponent} from './pages/productos/productos.component';
import {ContactoComponent} from './pages/contacto/contacto.component';
import {NosotrosComponent} from './pages/nosotros/nosotros.component';
import {ServiciosComponent} from './pages/servicios/servicios.component';
import {LoginComponent} from './portal/pages/login/login.component';
import {PanelControlComponent} from './portal/pages/panel-control/panel-control.component';
import {AdministradorComponent} from './portal/pages/administrador/administrador.component';
import {ConsorciosComponent} from './portal/pages/consorcios/consorcios.component';
import {ArchivosComponent} from './portal/pages/archivos/archivos.component';
import {AuthGuard} from "./portal/pages/login/login-core/auth.guard";

const routes: Routes = [
  {
    path: '', redirectTo: 'home', pathMatch: 'full'
  },
  {
    path: '', component: PagesComponent,
    children: [
      {path: 'home', component: HomeComponent},
      {path: 'productos', component: ProductosComponent},
      {path: 'contacto', component: ContactoComponent},
      {path: 'nosotros', component: NosotrosComponent},
      {path: 'servicios', component: ServiciosComponent}
    ]
  },
  {
    path: 'login', component: LoginComponent
  },
  {
    path: 'panel',
    component: PanelControlComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {path: '', redirectTo: 'administrador', pathMatch: 'full'},
      {path: 'administrador', component: AdministradorComponent},
      {path: 'consorcios', component: ConsorciosComponent},
      {path: 'archivos', component: ArchivosComponent}
    ]
  },
  {
    path: '**', redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
