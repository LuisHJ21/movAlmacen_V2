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

export interface MenuOption {
  label: string
  description: string
  path: string
  Icon: LucideIcon
  /** Opción que deshace operaciones: se muestra en rojo */
  destructive?: boolean
}

export interface MenuSection {
  title: string
  options: MenuOption[]
}

export const menuSections: MenuSection[] = [
  {
    title: 'Operaciones',
    options: [
      { label: 'Generar vale', description: 'Ingreso o salida de pallets', path: '/generar-vale', Icon: FilePlus2 },
      { label: 'Transferir entre almacenes', description: 'Traslada un pallet a otro almacén', path: '/transferencia-almacen', Icon: ArrowRightLeft },
      { label: 'Transferir entre pallets', description: 'Pasa producto entre pallets', path: '/transferencia-pallet', Icon: Layers },
      { label: 'Asignar ubicación', description: 'Escanea y ubica un pallet', path: '/asignar-ubicacion', Icon: MapPin },
    ],
  },
  {
    title: 'Consultas',
    options: [
      { label: 'Historial de vales', description: 'Consulta tus vales por fecha', path: '/historial-vales', Icon: ClipboardList },
      { label: 'Detalle de pallet', description: 'Escanea y consulta un pallet', path: '/detalle-pallet', Icon: Search },
    ],
  },
  {
    title: 'Anulaciones',
    options: [
      { label: 'Anular transferencia', description: 'Revierte una transferencia', path: '/anular-transferencia', Icon: Ban, destructive: true },
    ],
  },
]

export const menuOptions: MenuOption[] = menuSections.flatMap((section) => section.options)
