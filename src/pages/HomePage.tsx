import { MenuOptionButton } from '@/components/home/MenuOptionButton'
import { menuSections } from '@/components/home/menuOptions'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-8">
      <h1 className="sr-only">Operaciones disponibles</h1>

      <div className="space-y-5 sm:space-y-8">
        {menuSections.map(({ title, options }) => (
          <section key={title} aria-labelledby={`section-${title}`}>
            <h2
              id={`section-${title}`}
              className="mb-2 px-1 font-sans text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase"
            >
              {title}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {options.map((option) => (
                <li key={option.path}>
                  <MenuOptionButton {...option} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
