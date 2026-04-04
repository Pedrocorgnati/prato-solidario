// RESOLVED: generateMetadata com description e openGraph
export const metadata = {
  title: "Política de Privacidade — Prato Solidário",
  description: "Saiba como o Prato Solidário coleta, usa e protege seus dados pessoais conforme a LGPD (Lei 13.709/2018).",
  openGraph: {
    title: "Política de Privacidade — Prato Solidário",
    description: "Transparência total no uso de dados pessoais. Conformidade com a LGPD.",
  },
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-6">
        Política de Privacidade
      </h1>
      <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
        <p>Última atualização: Janeiro de 2025</p>
        <p>
          Esta Política de Privacidade descreve como o Prato Solidário coleta, usa e protege
          suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Dados coletados</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nome e e-mail para criação de conta</li>
          <li>Localização aproximada para exibir doações próximas</li>
          <li>Dados de contato (telefone) para comunicações</li>
          <li>Histórico de doações e retiradas</li>
        </ul>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Uso dos dados</h2>
        <p>
          Seus dados são usados exclusivamente para operação da plataforma, nunca vendidos a terceiros.
        </p>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Seus direitos (LGPD)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Acesso, correção e exclusão dos seus dados</li>
          <li>Portabilidade de dados</li>
          <li>Revogação de consentimento</li>
        </ul>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Contato do DPO</h2>
        <p>privacidade@pratosolidario.com.br</p>
      </div>
    </div>
  )
}
