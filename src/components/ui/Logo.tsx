import { Package, Scan } from 'lucide-react'

type Variant = 'stacked' | 'inline'

/** Ícono: pallet/caja dentro de un marco de escaneo */
function LogoMark({ size }: { size: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-16 rounded-2xl' : 'size-10 rounded-xl'
  const frame = size === 'lg' ? 'size-11' : 'size-7'
  const pkg = size === 'lg' ? 'size-5' : 'size-3.5'
  return (
    <span aria-hidden className={`relative grid shrink-0 place-items-center bg-brand text-white ${box}`}>
      <Scan className={frame} strokeWidth={1.75} />
      <Package className={`absolute ${pkg}`} strokeWidth={2} />
    </span>
  )
}

function Wordmark({ size }: { size: 'md' | 'lg' }) {
  return (
    <span className={`flex flex-col ${size === 'lg' ? 'items-center' : 'items-start'}`}>
      <span
        className={`font-heading leading-none font-bold tracking-tight ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
      >
        <span className="text-foreground">mov</span>
        <span className="text-primary">almacén</span>
      </span>
      <span
        className={`mt-1 font-semibold tracking-[0.2em] text-muted-foreground uppercase ${
          size === 'lg' ? 'text-xs' : 'text-[0.625rem]'
        }`}
      >
        Control de pallets
      </span>
    </span>
  )
}

/** Logo de MovAlmacén. stacked: login · inline: Navbar */
export function Logo({ variant = 'inline' }: { variant?: Variant }) {
  if (variant === 'stacked') {
    return (
      <span className="flex flex-col items-center gap-4">
        <LogoMark size="lg" />
        <Wordmark size="lg" />
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size="md" />
      <Wordmark size="md" />
    </span>
  )
}
