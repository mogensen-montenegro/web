export interface AdministradorData {
    _id?:string
    nombre: string,
    email: string,
    telefono: string,
    direccion: string,
    cantidadConsorcio: number,
    consorcios?: ConsorcioData[]
}

export interface ConsorcioData {
  _id?:string
    nombre: string,
    encargado: string,
    telefono: string,
    direccion: string,
    cantidadCarpetas: number,
    cantidadArchivos: number,
}
