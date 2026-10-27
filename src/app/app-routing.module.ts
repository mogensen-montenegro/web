import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PagesComponent} from './pages/pages.component';
import {HomeComponent} from './pages/home/home.component';
import {ProductosComponent} from './pages/productos/productos.component';
import {ContactoComponent} from './pages/contacto/contacto.component';
import {NosotrosComponent} from './pages/nosotros/nosotros.component';
import {ServiciosComponent} from './pages/servicios/servicios.component';
import {NoticiasComponent} from './pages/noticias/noticias.component';
import {CotizarComponent} from './pages/cotizar/cotizar.component';
import {CotizarResultadoComponent} from './pages/cotizar/cotizar-resultado.component';
import {BasesCondicionesComponent} from './pages/bases-condiciones/bases-condiciones.component';
import {LoginComponent} from './portal/pages/login/login.component';
import {PanelControlComponent} from './portal/pages/panel-control/panel-control.component';
import {AdministradorComponent} from './portal/pages/administrador/administrador.component';
import {ConsorciosComponent} from './portal/pages/consorcios/consorcios.component';
import {ArchivosComponent} from './portal/pages/archivos/archivos.component';
import {GeneradorRecibosComponent} from './portal/pages/generador-recibos/generador-recibos.component';
import {NoticiaComponent} from './portal/pages/noticia/noticia.component';
import {PlantillasEmailComponent} from './portal/pages/plantillas-email/plantillas-email.component';
import {ProspectosComponent} from './portal/pages/prospectos/prospectos.component';
import {TuPersonalComponent} from './portal/pages/tu-personal/tu-personal.component';
import {PanelProfesorComponent} from './portal/pages/tu-personal/panel-profesor/panel-profesor.component';
import {ReportesComponent} from './portal/pages/reportes/reportes.component';
import {ConfiguracionComponent} from './portal/pages/configuracion/configuracion.component';
import {DriveExplorerComponent} from './portal/pages/drive/drive-explorer.component';
import {DriveGuard} from './portal/pages/drive/drive.guard';
import {AuthGuard} from "./portal/pages/login/login-core/auth.guard";
import {RoleGuard} from "./portal/pages/login/login-core/role.guard";
import {RedirectGuard} from "./portal/pages/login/login-core/redirect.guard";
import {EmptyComponent} from "./portal/pages/login/empty.component";

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
      {path: 'servicios', component: ServiciosComponent},
      {path: 'noticias', component: NoticiasComponent},
      {path: 'cotizar', component: CotizarComponent},
      {path: 'cotizar/exito', component: CotizarResultadoComponent, data: {tipo: 'exito'}},
      {path: 'cotizar/error', component: CotizarResultadoComponent, data: {tipo: 'error'}},
      {path: 'basesCondiciones', component: BasesCondicionesComponent}
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
      {
        path: '',
        component: EmptyComponent,
        canActivate: [RedirectGuard]
      },
      {
        path: 'administrador',
        component: AdministradorComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal'], sidebarId: 'consorcio'}
      },
      {
        path: 'consorcios',
        component: ConsorciosComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal'], sidebarId: 'consorcios'}
      },
      {
        path: 'archivos',
        component: ArchivosComponent,
        canActivate: [RoleGuard],
        data: {roles: ['admin', 'superuser', 'personal'], sidebarId: 'base'}
      },
      {
        path: 'generador-recibos',
        component: GeneradorRecibosComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal'], sidebarId: 'generador-recibos'}
      },
      {
        path: 'noticia',
        component: NoticiaComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal'], sidebarId: 'noticia'}
      },
      {
        path: 'plantillas-email',
        component: PlantillasEmailComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal'], sidebarId: 'plantillas-email'}
      },
      {
        path: 'prospectos',
        component: ProspectosComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal'], sidebarId: 'prospectos'}
      },
      {
        path: 'agregar-profesor/panel-profesor',
        component: PanelProfesorComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser'], sidebarId: 'addProf'}
      },
      {
        path: 'agregar-profesor',
        component: TuPersonalComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser'], sidebarId: 'addProf'}
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser'], sidebarId: 'reportes'}
      },
      {
        path: 'configuracion',
        component: ConfiguracionComponent,
        canActivate: [RoleGuard],
        data: {roles: ['superuser', 'personal']}
      },
      {
        path: 'drive',
        component: DriveExplorerComponent,
        canActivate: [RoleGuard, DriveGuard],
        data: {roles: ['superuser', 'personal', 'admin'], sidebarId: 'drive'}
      }
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
