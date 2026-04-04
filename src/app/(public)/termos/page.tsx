// RESOLVED: generateMetadata com description e openGraph
export const metadata = {
  title: "Termos de Uso — Prato Solidário",
  description: "Leia os Termos de Uso da plataforma Prato Solidário. Saiba seus direitos, deveres e como funciona a moderação da comunidade.",
  openGraph: {
    title: "Termos de Uso — Prato Solidário",
    description: "Termos de Uso da plataforma Prato Solidário conforme a Lei 14.016/2020.",
  },
}

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-6">Termos de Uso</h1>
      <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-4">
        <p>Última atualização: Janeiro de 2025</p>
        <p>
          Ao usar o Prato Solidário, você concorda com estes termos. Nossa plataforma conecta
          doadores de alimentos com receptores de forma segura e transparente.
        </p>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">1. Uso Aceitável</h2>
        <p>
          O Prato Solidário deve ser utilizado exclusivamente para fins solidários. É proibido
          o uso comercial não autorizado das doações ou a revenda de refeições obtidas pela plataforma.
        </p>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">2. Responsabilidade dos Doadores</h2>
        <p>
          Doadores são responsáveis pela qualidade e segurança alimentar dos alimentos doados,
          garantindo que estejam dentro do prazo de validade e em condições adequadas de consumo.
        </p>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">3. Privacidade</h2>
        <p>
          Seus dados são tratados conforme nossa Política de Privacidade, em conformidade com a LGPD.
        </p>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">4. Contato</h2>
        <p>Para dúvidas: contato@pratosolidario.com.br</p>
      </div>
    </div>
  )
}
