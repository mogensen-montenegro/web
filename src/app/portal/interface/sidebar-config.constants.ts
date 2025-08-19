import {SidebarConfig} from "./sidebar.interfaces"

export const GYM_ROUTES_CONFIG: SidebarConfig[] = [
  {
    id: 'consorcio',
    name: 'Mis Administradores',
    url: '/panel/administrador',
    icon: 'fa-home'
  },
  {
    id: 'consorcios',
    name: 'Mis Consorcios',
    url: '/panel/consorcios',
    icon: 'fa-building'
  },
  {
    id: 'base',
    name: 'Carga de Archivos',
    url: '/panel/archivos',
    icon: 'fa-file'
  }
]
