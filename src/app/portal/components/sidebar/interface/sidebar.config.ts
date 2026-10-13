import {SidebarConfig} from "./sidebar.interface"

export const GYM_ROUTES_CONFIG: SidebarConfig[] = [
  {
    id: 'consorcio',
    name: 'Administradores',
    url: '/panel/administrador',
    icon: 'fa-home',
    roles: ['superuser', 'personal']
  },
  {
    id: 'consorcios',
    name: 'Consorcios',
    url: '/panel/consorcios',
    icon: 'fa-building',
    roles: ['superuser', 'personal']
  },
  {
    id: 'base',
    name: 'Carga de Archivos',
    url: '/panel/archivos',
    icon: 'fa-file',
    roles: ['superuser', 'admin', 'personal']
  },
  {
    id: 'generador-recibos',
    name: 'Generador de recibos',
    url: '/panel/generador-recibos',
    icon: 'fa-receipt',
    roles: ['superuser', 'personal']
  },
  {
    id: 'noticia',
    name: 'Noticia',
    url: '/panel/noticia',
    icon: 'fa-newspaper',
    roles: ['superuser', 'personal']
  },
  {
    id: 'plantillas-email',
    name: 'Plantillas de Email',
    url: '/panel/plantillas-email',
    icon: 'fa-envelope',
    roles: ['superuser', 'personal']
  },
  {
    id: 'prospectos',
    name: 'Prospectos',
    url: '/panel/prospectos',
    icon: 'fa-users',
    roles: ['superuser', 'personal']
  },
  {
    id: 'addProf',
    name: 'Tu Personal',
    url: '/panel/agregar-profesor',
    icon: 'fa-user-tie',
    roles: ['superuser']
  },
  {
    id: 'reportes',
    name: 'Reportes',
    url: '/panel/reportes',
    icon: 'fa-chart-line',
    roles: ['superuser']
  }
]
