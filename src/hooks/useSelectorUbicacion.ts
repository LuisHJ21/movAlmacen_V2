import { useEffect, useState } from 'react'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { UbicacionOpcion } from '@/interfaces/ubicacion.interface'
import { nivelFiltro, PARTES_UBICACION } from '@/utils/ubicacion'
import { useUbicaciones } from './useUbicaciones'

interface Eleccion {
  codigo: string
  auto: boolean
  multiple?: boolean
}

const largoHasta = (partes: number) => PARTES_UBICACION.slice(0, partes).reduce((sum, p) => sum + p.largo, 0)

/**
 * Armado de una ubicación dentro de un almacén: código → lado → columna → nivel → profundidad.
 * Consulta las opciones de cada paso, elige sola la única opción con espacio y permite retroceder
 * o volver a una parte ya elegida. `activo` pausa las consultas (ej. mientras el paso no se muestra).
 */
export function useSelectorUbicacion(almacen: Warehouse | null, activo: boolean) {
  const [elecciones, setElecciones] = useState<Eleccion[]>([])

  const paso = elecciones.length
  const codigo = elecciones.at(-1)?.codigo ?? ''
  const parte = PARTES_UBICACION[paso]
  const completo = paso === PARTES_UBICACION.length

  const filtro = activo && almacen && !completo ? (paso === 0 ? almacen.ubicaciones.join(',') : codigo) : ''
  const { opciones: todas, isLoading, error, reload } = useUbicaciones(filtro, nivelFiltro(paso))
  const opciones = todas.filter(
    (o) =>
      o.codigo.length === largoHasta(paso + 1) &&
      (paso === 0 ? almacen?.ubicaciones.includes(o.codigo) : o.codigo.startsWith(codigo)),
  )

  useEffect(() => {
    if (!activo || completo || isLoading || error || opciones.length !== 1 || opciones[0].disponibles === 0) return
    const unica = opciones[0]
    setElecciones((current) =>
      current.at(-1)?.codigo === unica.codigo
        ? current
        : [...current, { codigo: unica.codigo, auto: true, multiple: unica.multiple }],
    )
  }, [activo, completo, isLoading, error, opciones])

  const elegir = (opcion: UbicacionOpcion) =>
    setElecciones((current) => [...current, { codigo: opcion.codigo, auto: false, multiple: opcion.multiple }])

  const irAParte = (indice: number) => setElecciones((current) => current.slice(0, indice))

  /**
   * Quita la última parte elegida a mano junto con las que se eligieron solas después.
   * Devuelve false si no quedaba ninguna elegida a mano (quien llama decide a dónde volver).
   */
  const retroceder = (): boolean => {
    const ultimaManual = elecciones.findLastIndex((e) => !e.auto)
    setElecciones(ultimaManual === -1 ? [] : elecciones.slice(0, ultimaManual))
    return ultimaManual !== -1
  }

  const reiniciar = () => setElecciones([])

  return {
    paso,
    codigo,
    parte,
    completo,
    opciones,
    isLoading,
    error,
    reload,
    elegir,
    irAParte,
    retroceder,
    reiniciar,
    multiple: !!elecciones.at(-1)?.multiple,
    automaticas: elecciones.map((e) => e.auto),
    hayEditables: elecciones.some((e) => !e.auto),
  }
}

export type SelectorUbicacionState = ReturnType<typeof useSelectorUbicacion>
