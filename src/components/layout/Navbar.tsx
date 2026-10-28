import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { UserMenu } from './UserMenu'

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 bg-primary pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between pr-2 pl-4">
        <Link
          to="/"
          aria-label="Ir al inicio"
          className="-ml-1 flex h-touch items-center rounded-lg px-1 focus-visible:outline-white"
        >
          <Logo onPrimary />
        </Link>
        <UserMenu />
      </div>
    </header>
  )
}
