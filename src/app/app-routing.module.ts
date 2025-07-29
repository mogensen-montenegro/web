import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { NosotrosComponent } from './pages/nosotros/nosotros.component';
import { ServiciosComponent } from './pages/servicios/servicios.component';
import { LoginComponent } from './portal/pages/login/login.component';
import { PanelControlComponent } from './portal/pages/panel-control/panel-control.component';
import { ConsorciosComponent } from './portal/pages/consorcios/consorcios.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '', component: PagesComponent,
    children: [
       { path: 'home', component: HomeComponent },
       { path: 'productos', component: ProductosComponent },
       { path: 'contacto', component: ContactoComponent },
       { path: 'nosotros', component: NosotrosComponent },
       { path: 'servicios', component: ServiciosComponent },
    ]
  },
    { path: 'login', component: LoginComponent },
    { path: 'panel', component: PanelControlComponent,
      children: [
        { path: '', redirectTo: 'consorcio', pathMatch: 'full' },
        { path: 'consorcio', component: ConsorciosComponent },
      ]
     },
  // {
   // path: 'panel', component: PanelControlComponent, canLoad: [AuthGuard], canActivateChild: [AuthGuard], loadChildren: () => import('./pages/panel-control/panel-control.routes')
 // }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
