import { useState } from "react";
import { Link } from "react-router-dom";

type Tab = "clubes" | "atletas" | "privacidade";

const TermsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("clubes");

  const tabs: { id: Tab; label: string }[] = [
    { id: "clubes", label: "Para Clubes" },
    { id: "atletas", label: "Para Atletas" },
    { id: "privacidade", label: "Privacidade" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.08] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#0a0e1a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg">Bubble Padel</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2">
            Termos de Uso e Privacidade
          </h1>
          <p className="text-gray-400 text-sm">Versão 1.0 — Março de 2026</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#00ff88] text-[#0a0e1a]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          {/* ── CLUBES ─────────────────────────────────────────────────── */}
          {activeTab === "clubes" && (
            <div className="space-y-8" id="clubes">
              <Section title="1. Objeto do Serviço">
                <p>
                  A <strong>Bubble Padel</strong> é uma plataforma digital de
                  gestão de torneios de padel e beach tennis. Ao criar uma conta
                  como clube organizador, você ("Clube") concorda com os termos
                  abaixo.
                </p>
                <p>
                  O serviço oferece: criação e gerenciamento de torneios,
                  recebimento de inscrições de atletas, geração automática de
                  grupos e schedules, gestão de playoffs e publicação de
                  resultados.
                </p>
              </Section>

              <Section title="2. Cadastro e Responsabilidades do Clube">
                <p>
                  O Clube é o único responsável pela organização do torneio,
                  incluindo: definição de categorias, datas, local, regras,
                  quadras disponíveis e comunicação com os atletas inscritos.
                </p>
                <p>
                  Ao utilizar a plataforma, o Clube garante que as informações
                  cadastradas são verdadeiras, possui autorização para utilizar
                  as quadras indicadas e seguirá as regras oficiais da
                  modalidade.
                </p>
              </Section>

              <Section title="3. Modelo de Cobrança e Repasse">
                <p>
                  A Bubble cobra uma taxa de serviço por atleta inscrito em cada
                  torneio, conforme definido no momento do cadastro. O valor
                  líquido é repassado ao Clube após a conclusão do torneio, no
                  prazo de até 7 dias úteis via PIX.
                </p>
              </Section>

              <Section title="4. Cancelamento de Torneio pelo Clube">
                <p>
                  Em caso de cancelamento pelo Clube, todos os atletas que
                  realizaram pagamento terão direito ao reembolso integral. O
                  Clube deve cancelar com pelo menos{" "}
                  <strong>48 horas de antecedência</strong> e notificar os
                  atletas inscritos.
                </p>
              </Section>

              <Section title="5. Responsabilidade por Lesões e Acidentes">
                <p>
                  A Bubble é uma plataforma de gestão e não se responsabiliza
                  por lesões, acidentes ou danos ocorridos durante a realização
                  dos torneios. O Clube é inteiramente responsável pela
                  segurança do evento.
                </p>
              </Section>

              <Section title="6. Dados dos Atletas — LGPD">
                <p>
                  Os dados pessoais dos atletas (nome e e-mail) devem ser
                  utilizados exclusivamente para fins de organização e
                  comunicação do torneio.
                </p>
              </Section>

              <Section title="7. Suspensão de Conta">
                <p>
                  A Bubble pode suspender contas de Clubes que violem estes
                  Termos, publiquem informações falsas ou prejudiquem atletas
                  inscritos.
                </p>
              </Section>

              <Section title="8. Alterações dos Termos">
                <p>
                  A Bubble pode atualizar estes Termos a qualquer momento. O
                  Clube será notificado por e-mail com pelo menos{" "}
                  <strong>30 dias de antecedência</strong>.
                </p>
              </Section>

              <Section title="9. Foro">
                <p>
                  Fica eleito o foro da comarca de{" "}
                  <strong>Joinville — SC</strong> para dirimir eventuais
                  conflitos.
                </p>
              </Section>
            </div>
          )}

          {/* ── ATLETAS ────────────────────────────────────────────────── */}
          {activeTab === "atletas" && (
            <div className="space-y-8" id="atletas">
              <Section title="1. Inscrição e Participação">
                <p>
                  Ao se inscrever em um torneio pela plataforma Bubble, você
                  ("Atleta") confirma que leu e aceita estes Termos. A inscrição
                  é feita em dupla e confirma a participação de ambos os atletas
                  na categoria selecionada.
                </p>
                <p>
                  A inscrição estará <strong>confirmada</strong> somente após o
                  pagamento do valor indicado (quando aplicável).
                </p>
              </Section>

              <Section title="2. Cancelamento pelo Atleta">
                <p>
                  O Atleta pode cancelar sua inscrição diretamente com o Clube
                  organizador. A política de reembolso aplicável é:
                </p>
                <ul>
                  <li>
                    <strong>Cancelamento até 48 horas antes do torneio:</strong>{" "}
                    reembolso integral do valor pago, descontada a taxa de
                    processamento PIX
                  </li>
                  <li>
                    <strong>Cancelamento com menos de 48 horas:</strong> sem
                    direito a reembolso, salvo se o torneio for cancelado pelo
                    Clube
                  </li>
                </ul>
              </Section>

              <Section title="3. Responsabilidade por Lesões">
                <p>
                  A participação em torneios de padel e beach tennis envolve
                  atividade física intensa. O Atleta declara estar ciente dos
                  riscos inerentes à prática esportiva e isenta a Bubble de
                  qualquer responsabilidade por lesões ou acidentes ocorridos
                  durante o torneio.
                </p>
              </Section>

              <Section title="4. Atletas Menores de Idade">
                <p>
                  Atletas com menos de 18 anos devem ter autorização expressa de
                  um responsável legal para participar. Ao se inscrever,
                  confirma-se que essa autorização foi obtida.
                </p>
              </Section>

              <Section title="5. Uso dos Dados Pessoais">
                <p>
                  Seus dados (nome e e-mail) serão utilizados para: confirmar a
                  inscrição, comunicar informações do torneio e enviar
                  notificações relevantes. Não compartilhamos seus dados com
                  terceiros para fins publicitários.
                </p>
                <p>
                  Para exercer seus direitos (acesso, correção, exclusão):{" "}
                  <a
                    href="mailto:privacidade@bubblepadel.com"
                    className="text-[#00ff88]"
                  >
                    privacidade@bubblepadel.com
                  </a>
                </p>
              </Section>

              <Section title="6. Imagem e Resultados">
                <p>
                  Ao participar de um torneio, o Atleta autoriza a Bubble a
                  publicar seu nome e resultado (classificação, categoria) na
                  página pública do torneio.
                </p>
              </Section>

              <Section title="7. Foro">
                <p>
                  Fica eleito o foro da comarca de{" "}
                  <strong>Joinville — SC</strong> para dirimir eventuais
                  conflitos.
                </p>
              </Section>
            </div>
          )}

          {/* ── PRIVACIDADE ────────────────────────────────────────────── */}
          {activeTab === "privacidade" && (
            <div className="space-y-8" id="privacidade">
              <Section title="1. Quem Somos">
                <p>
                  A <strong>Bubble Padel</strong> é responsável pelo tratamento
                  dos dados pessoais coletados pela plataforma. Contato:{" "}
                  <a
                    href="mailto:privacidade@bubblepadel.com"
                    className="text-[#00ff88]"
                  >
                    privacidade@bubblepadel.com
                  </a>
                </p>
              </Section>

              <Section title="2. Dados que Coletamos">
                <p>
                  <strong>De Clubes:</strong> nome, e-mail, informações dos
                  torneios criados.
                </p>
                <p>
                  <strong>De Atletas:</strong> nome completo (ambos os jogadores
                  da dupla), e-mail (ambos), categoria, status de pagamento,
                  resultados e classificações.
                </p>
              </Section>

              <Section title="3. Para Que Usamos os Dados">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-2 pr-4 text-gray-400 font-semibold">
                        Finalidade
                      </th>
                      <th className="text-left py-2 text-gray-400 font-semibold">
                        Base Legal (LGPD)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      [
                        "Confirmar inscrição e comunicar informações do torneio",
                        "Art. 7º, V — Execução de contrato",
                      ],
                      [
                        "Enviar e-mails transacionais (confirmação, lembretes, resultados)",
                        "Art. 7º, V — Execução de contrato",
                      ],
                      [
                        "Publicar resultados na página pública do torneio",
                        "Art. 7º, VI — Legítimo interesse",
                      ],
                      [
                        "Cumprir obrigações legais (registros fiscais)",
                        "Art. 7º, II — Obrigação legal",
                      ],
                    ].map(([fin, base]) => (
                      <tr key={fin}>
                        <td className="py-2 pr-4 text-gray-300">{fin}</td>
                        <td className="py-2 text-gray-400 text-xs">{base}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="4. Por Quanto Tempo Guardamos os Dados">
                <ul>
                  <li>
                    <strong>Dados de inscrição e resultados:</strong> 2 anos
                    após o torneio
                  </li>
                  <li>
                    <strong>Dados de pagamento:</strong> 5 anos (CTN Art. 195)
                  </li>
                  <li>
                    <strong>Dados de conta do Clube:</strong> enquanto ativa + 1
                    ano após encerramento
                  </li>
                </ul>
              </Section>

              <Section title="5. Compartilhamento de Dados">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-2 pr-4 text-gray-400 font-semibold">
                        Empresa
                      </th>
                      <th className="text-left py-2 text-gray-400 font-semibold">
                        Finalidade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ["Railway", "Hospedagem da plataforma e banco de dados"],
                      ["Resend", "Envio de e-mails transacionais"],
                      [
                        "Gateway de Pagamento (a definir)",
                        "Processamento de pagamentos PIX",
                      ],
                    ].map(([emp, fin]) => (
                      <tr key={emp}>
                        <td className="py-2 pr-4 text-gray-300 font-medium">
                          {emp}
                        </td>
                        <td className="py-2 text-gray-400">{fin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="6. Seus Direitos (LGPD)">
                <p>
                  Você tem direito a: acesso, correção, exclusão, portabilidade
                  e revogação do consentimento dos seus dados.
                </p>
                <p>
                  Para exercer qualquer direito, envie um e-mail para{" "}
                  <a
                    href="mailto:privacidade@bubblepadel.com"
                    className="text-[#00ff88]"
                  >
                    privacidade@bubblepadel.com
                  </a>
                  . Respondemos em até <strong>15 dias úteis</strong>.
                </p>
              </Section>

              <Section title="7. Segurança">
                <p>
                  Adotamos criptografia em trânsito (HTTPS), autenticação via
                  tokens JWT e acesso ao banco de dados restrito a sistemas
                  autorizados.
                </p>
              </Section>

              <Section title="8. Alterações desta Política">
                <p>
                  Alterações relevantes serão comunicadas por e-mail com pelo
                  menos <strong>15 dias de antecedência</strong>.
                </p>
              </Section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] text-center text-sm text-gray-500">
          <p>Bubble Padel · Versão 1.0 · Março 2026</p>
          <p className="mt-1">
            Dúvidas?{" "}
            <a
              href="mailto:privacidade@bubblepadel.com"
              className="text-[#00ff88] hover:underline"
            >
              privacidade@bubblepadel.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

// ── Componente auxiliar ────────────────────────────────────────────────────────
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h2 className="text-lg font-bold text-white mb-3 pb-2 border-b border-white/[0.08]">
      {title}
    </h2>
    <div className="text-gray-300 leading-relaxed space-y-3 text-sm">
      {children}
    </div>
  </div>
);

export default TermsPage;
