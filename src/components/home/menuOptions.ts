import {
  ArrowRightLeft,
  Ban,
  ClipboardList,
  FilePlus2,
  Layers,
  MapPin,
  Search,
  type LucideIcon,
} from 'lucide-react'
import type { MenuTone } from './MenuOptionButton'

export interface MenuOption {
  label: string
  description: string
  path: string
  Icon: LucideIcon
}

export interface MenuSection {
  title: string
  /** Color de las tarjetas de la sección */
  tone: MenuTone
  options: MenuOption[]
}

export const menuSections: MenuSection[] = [
  {
    title: 'Operaciones',
    tone: 'operacion',
    options: [
      { label: 'Generar vale', description: 'Ingreso o salida de pallets', path: '/generar-vale', Icon: FilePlus2 },
      { label: 'Transferir entre almacenes', description: 'Traslada un pallet a otro almacén', path: '/transferencia-almacen', Icon: ArrowRightLeft },
      { label: 'Transferir entre pallets', description: 'Pasa producto entre pallets', path: '/transferencia-pallet', Icon: Layers },
      { label: 'Asignar ubicación', description: 'Escanea y ubica un pallet', path: '/asignar-ubicacion', Icon: MapPin },
    ],
  },
  {
    title: 'Consultas',
    tone: 'consulta',
    options: [
      { label: 'Historial de vales', description: 'Consulta tus vales por fecha', path: '/historial-vales', Icon: ClipboardList },
      { label: 'Detalle de pallet', description: 'Escanea y consulta un pallet', path: '/detalle-pallet', Icon: Search },
    ],
  },
  {
    title: 'Anulaciones',
    tone: 'anulacion',
    options: [
      { label: 'Anular transferencia', description: 'Revierte una transferencia', path: '/anular-transferencia', Icon: Ban },
    ],
  },
]

export const menuOptions: MenuOption[] = menuSections.flatMap((section) => section.options)
