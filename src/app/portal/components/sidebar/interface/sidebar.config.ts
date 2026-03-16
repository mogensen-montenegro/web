import {SidebarConfig} from "./sidebar.interface"

export const GYM_ROUTES_CONFIG: SidebarConfig[] = [
  {
    id: 'consorcio',
    name: 'Administradores',
    url: '/panel/administrador',
    icon: 'fa-home',
    roles: ['superuser']
  },
  {
    id: 'consorcios',
    name: 'Consorcios',
    url: '/panel/consorcios',
    icon: 'fa-building',
    roles: ['superuser']
  },
  {
    id: 'base',
    name: 'Carga de Archivos',
    url: '/panel/archivos',
    icon: 'fa-file',
    roles: ['superuser', 'admin']
  },
  {
    id: 'generador-recibos',
    name: 'Generador de recibos',
    url: '/panel/generador-recibos',
    icon: 'fa-receipt',
    roles: ['superuser']
  },
  {
    id: 'noticia',
    name: 'Noticia',
    url: '/panel/noticia',
    icon: 'fa-newspaper',
    roles: ['superuser']
  },
  {
    id: 'plantillas-email',
    name: 'Plantillas de Email',
    url: '/panel/plantillas-email',
    icon: 'fa-envelope',
    roles: ['superuser']
  }
]
