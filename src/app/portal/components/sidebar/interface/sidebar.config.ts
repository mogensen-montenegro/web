import {SidebarConfig} from "./sidebar.interface"

export const GYM_ROUTES_CONFIG: SidebarConfig[] = [
  {
    id: 'consorcio',
    name: 'Administradores',
    url: '/panel/administrador',
    icon: 'fa-home'
  },
  {
    id: 'consorcios',
    name: 'Consorcios',
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
