/**
 * SkipLinks — acessibilidade por teclado (WCAG 2.1 AA).
 * Visível apenas ao receber foco via Tab.
 * Deve ser o primeiro elemento focável da página.
 * @see module-7-layout-navigation/TASK-4/ST004
 */
export function SkipLinks() {
  return (
    <div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[var(--color-primary-raw)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Ir para o conteúdo principal
      </a>
      <a
        href="#main-nav"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-52 focus:z-[100] focus:bg-[var(--color-primary-raw)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Ir para a navegação
      </a>
    </div>
  )
}
