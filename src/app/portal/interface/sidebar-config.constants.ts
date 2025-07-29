import { SidebarConfig } from "./sidebar.interfaces"

export const GYM_ROUTES_CONFIG: SidebarConfig[] = [
    {
        id: 'consorcio',
        name: 'Mis Consorcios',
        url: '/panel/consorcio',
        icon: 'fa-home'
    },
    {
        id: 'base',
        name: 'Carga de Archivos',
        url: '/panel/base',
        icon: 'fa-database'
    },
]
