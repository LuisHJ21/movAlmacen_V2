import { MenuOptionButton } from '@/components/home/MenuOptionButton'
import { menuSections } from '@/components/home/menuOptions'

const sectionTitleClass = 'mb-2 px-1 font-sans text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground'

/** Inicio: opciones en tarjetas de tono suave, en 2 columnas; la que queda sola en su fila ocupa el ancho */
export default function HomePage() {
  return (
    <div className="flex-1 bg-card">
      <h1 className="sr-only">Operaciones disponibles</h1>

      <div className="mx-auto max-w-5xl space-y-5 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:space-y-8 sm:pt-6">
        {menuSections.map(({ title, tone, options }) => (
          <section key={title} aria-labelledby={`section-${title}`}>
            <h2 id={`section-${title}`} className={sectionTitleClass}>
              {title}
            </h2>
            <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
              {options.map((option, index) => {
                const sola = options.length % 2 === 1 && index === options.length - 1
                return (
                  <li key={option.path} className={sola ? 'col-span-2 lg:col-span-1' : undefined}>
                    <MenuOptionButton {...option} tone={tone} />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
