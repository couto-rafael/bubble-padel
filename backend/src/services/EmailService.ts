import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Bubble Padel <onboarding@resend.dev>";
const DEV_MODE =
  !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test";

// ─── COMISSÃO BUBBLE ──────────────────────────────────────────────────────────
// Alterar este valor quando a monetização for ativada
export const COMMISSION_PER_ATHLETE = 0; // R$ por atleta

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

interface InscricaoConfirmadaData {
  player1Name: string;
  player2Name: string;
  player1Email: string;
  player2Email: string;
  tournamentName: string;
  tournamentDate: string;
  category: string;
  tournamentId: string;
}

interface NovaInscricaoData {
  clubEmail: string;
  player1Name: string;
  player2Name: string;
  category: string;
  tournamentName: string;
  tournamentId: string;
}

interface LembreteTorneioData {
  player1Name: string;
  player1Email: string;
  player2Name: string;
  player2Email: string;
  tournamentName: string;
  tournamentDate: string;
  category: string;
  tournamentId: string;
  firstGameTime: string | null;
  firstGameCourt: string | null;
  clubSede: string | null;
}

interface ResultadoBaseData {
  player1Name: string;
  player1Email: string;
  player2Name: string;
  player2Email: string;
  tournamentName: string;
  category: string;
  tournamentId: string;
}

interface RelatorioRepasseData {
  clubEmail: string;
  clubName: string;
  tournamentName: string;
  tournamentId: string;
  totalBruto: number;
  comissao: number;
  valorRepasse: number;
  totalAtletas: number;
}

// ─── FUNÇÃO BASE ──────────────────────────────────────────────────────────────

async function sendEmail(options: EmailOptions): Promise<void> {
  if (DEV_MODE) {
    console.log("📧 [DEV EMAIL] Para:", options.to);
    console.log("📧 [DEV EMAIL] Assunto:", options.subject);
    console.log(
      "📧 [DEV EMAIL] (email não enviado — RESEND_API_KEY não configurada)",
    );
    return;
  }

  try {
    const to = Array.isArray(options.to) ? options.to : [options.to];
    console.log("📧 [EMAIL] Enviando para:", to);
    console.log("📧 [EMAIL] Assunto:", options.subject);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: options.subject,
      html: options.html,
    });
    console.log(
      "✅ [EMAIL] Enviado. ID:",
      (result as any).data?.id ?? JSON.stringify(result),
    );
  } catch (err) {
    console.error("❌ [EMAIL] Erro:", err);
  }
}

// ─── HEADER/FOOTER COMPARTILHADOS ────────────────────────────────────────────

function emailHeader(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#050f1a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#00ff88;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Bubble Padel</h1>
            <p style="margin:8px 0 0;color:#7a9ab5;font-size:14px;">Gestão de Torneios</p>
          </td>
        </tr>`;
}

function emailFooter(frontendUrl: string): string {
  return `
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e0e8f0;text-align:center;">
            <p style="margin:0;color:#7a9ab5;font-size:12px;">
              Bubble Padel · <a href="${frontendUrl}/termos" style="color:#7a9ab5;">Termos de Uso</a> · <a href="mailto:privacidade@bubblepadel.com" style="color:#7a9ab5;">privacidade@bubblepadel.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const FRONTEND = () => process.env.FRONTEND_URL || "http://localhost:5173";

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

function templateInscricaoConfirmada(data: InscricaoConfirmadaData): string {
  const url = `${FRONTEND()}/tournaments/${data.tournamentId}`;
  return `${emailHeader()}
        <tr><td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Inscrição recebida!</h2>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Sua inscrição no torneio foi registrada com sucesso. Aguarde a confirmação do organizador.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#7a9ab5;text-transform:uppercase;letter-spacing:1px;">Detalhes da inscrição</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Torneio</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.tournamentName}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Data</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.tournamentDate}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Categoria</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.category}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Jogador 1</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.player1Name}</strong></td></tr>
                <tr><td style="padding:8px 0;"><span style="color:#4a6580;font-size:14px;">Jogador 2</span></td><td style="padding:8px 0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.player2Name}</strong></td></tr>
              </table>
              <p style="margin:16px 0 0;padding:12px;background:#fff8e1;border-radius:8px;border-left:3px solid #f59e0b;font-size:13px;color:#92400e;">⏳ <strong>Status: Aguardando confirmação</strong> — o organizador irá confirmar sua dupla em breve.</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#00ff88;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver página do torneio →</a>
          </td></tr></table>
          <p style="margin:0;color:#4a6580;font-size:14px;line-height:1.6;">Dúvidas? Entre em contato com o organizador pela página acima.</p>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateNovaInscricaoClube(data: NovaInscricaoData): string {
  const url = `${FRONTEND()}/dashboard/tournaments/${data.tournamentId}?tab=inscricoes`;
  return `${emailHeader()}
        <tr><td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Nova inscrição recebida!</h2>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Uma nova dupla se inscreveu no seu torneio <strong>${data.tournamentName}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Categoria</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.category}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Jogador 1</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.player1Name}</strong></td></tr>
                <tr><td style="padding:8px 0;"><span style="color:#4a6580;font-size:14px;">Jogador 2</span></td><td style="padding:8px 0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.player2Name}</strong></td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#00ccff;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Gerenciar inscrições →</a>
          </td></tr></table>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateLembreteTorneio(data: LembreteTorneioData): string {
  const url = `${FRONTEND()}/tournaments/${data.tournamentId}`;
  const jogoRow = data.firstGameTime
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Primeiro jogo</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.firstGameTime}${data.firstGameCourt ? ` · ${data.firstGameCourt}` : ""}</strong></td></tr>`
    : "";
  const localRow = data.clubSede
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Local</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.clubSede}</strong></td></tr>`
    : "";
  return `${emailHeader()}
        <tr><td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Seu torneio é amanhã!</h2>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Olá, <strong>${data.player1Name}</strong> e <strong>${data.player2Name}</strong>! Amanhã é o dia — chegue com antecedência e boa sorte! 🏆</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#7a9ab5;text-transform:uppercase;letter-spacing:1px;">Detalhes do torneio</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Torneio</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.tournamentName}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Data</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.tournamentDate}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Categoria</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.category}</strong></td></tr>
                ${localRow}${jogoRow}
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#00ff88;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver tabela e horários →</a>
          </td></tr></table>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateCampeao(data: ResultadoBaseData): string {
  const url = `${FRONTEND()}/tournaments/${data.tournamentId}`;
  return `${emailHeader()}
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(135deg,#050f1a 0%,#0d2037 100%);padding:40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;">🏆</p>
            <h2 style="margin:0 0 8px;color:#00ff88;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CAMPEÕES!</h2>
            <p style="margin:0;color:#7a9ab5;font-size:16px;">Vocês foram os melhores do torneio</p>
          </div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;color:#4a6580;font-size:15px;line-height:1.6;"><strong>${data.player1Name}</strong> e <strong>${data.player2Name}</strong>, parabéns! 🎉 Vocês conquistaram o título na categoria <strong>${data.category}</strong> do torneio <strong>${data.tournamentName}</strong>.</p>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Guardem essa conquista — ela foi merecida. Até o próximo torneio! 🎾</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#00ff88;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver resultados do torneio →</a>
          </td></tr></table>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateVice(data: ResultadoBaseData): string {
  const url = `${FRONTEND()}/tournaments/${data.tournamentId}`;
  return `${emailHeader()}
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(135deg,#050f1a 0%,#0d2037 100%);padding:40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;">🥈</p>
            <h2 style="margin:0 0 8px;color:#00ccff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Vice-campeões!</h2>
            <p style="margin:0;color:#7a9ab5;font-size:16px;">Foi por muito pouco</p>
          </div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;color:#4a6580;font-size:15px;line-height:1.6;"><strong>${data.player1Name}</strong> e <strong>${data.player2Name}</strong>, chegaram até a final! 💪 Na categoria <strong>${data.category}</strong> do torneio <strong>${data.tournamentName}</strong>, vocês foram até o fim — e isso já é muito.</p>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">A próxima é de vocês. Fique de olho nos próximos torneios! 🎾</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#00ccff;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver resultados do torneio →</a>
          </td></tr></table>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateEliminadoPlayoffs(data: ResultadoBaseData): string {
  const url = `${FRONTEND()}/tournaments/${data.tournamentId}`;
  return `${emailHeader()}
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(135deg,#050f1a 0%,#0d2037 100%);padding:40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;">🎾</p>
            <h2 style="margin:0 0 8px;color:#f59e0b;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Chegaram longe!</h2>
            <p style="margin:0;color:#7a9ab5;font-size:16px;">Superaram a fase de grupos e foram aos playoffs</p>
          </div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;color:#4a6580;font-size:15px;line-height:1.6;"><strong>${data.player1Name}</strong> e <strong>${data.player2Name}</strong>, parabéns pela participação no torneio <strong>${data.tournamentName}</strong> — categoria <strong>${data.category}</strong>! 👏</p>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Chegar nos playoffs já é motivo de comemorar. A próxima oportunidade tá chegando! 💪</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#f59e0b;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver resultados do torneio →</a>
          </td></tr></table>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateEliminadoGrupos(data: ResultadoBaseData): string {
  const url = `${FRONTEND()}/tournaments/${data.tournamentId}`;
  return `${emailHeader()}
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(135deg,#050f1a 0%,#0d2037 100%);padding:40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;">👊</p>
            <h2 style="margin:0 0 8px;color:#7a9ab5;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Obrigado pela participação!</h2>
            <p style="margin:0;color:#7a9ab5;font-size:16px;">A próxima é diferente</p>
          </div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;color:#4a6580;font-size:15px;line-height:1.6;"><strong>${data.player1Name}</strong> e <strong>${data.player2Name}</strong>, valeu por participar do torneio <strong>${data.tournamentName}</strong> — categoria <strong>${data.category}</strong>! 🎾</p>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Todo torneio é aprendizado. Fique de olho nos próximos — a sua melhor fase tá por vir! 💪</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#7a9ab5;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver resultados do torneio →</a>
          </td></tr></table>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

function templateRelatorioRepasse(data: RelatorioRepasseData): string {
  const url = `${FRONTEND()}/dashboard/tournaments/${data.tournamentId}?tab=financeiro`;
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const comissaoLinha =
    data.comissao > 0
      ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Comissão Bubble (${data.totalAtletas} atletas)</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#ef4444;font-size:14px;">- ${fmt(data.comissao)}</strong></td></tr>`
      : `<tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Comissão Bubble</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#00ff88;font-size:14px;">Grátis no lançamento 🎉</strong></td></tr>`;

  return `${emailHeader()}
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(135deg,#050f1a 0%,#0d2037 100%);padding:40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;">📊</p>
            <h2 style="margin:0 0 8px;color:#00ccff;font-size:24px;font-weight:800;">Relatório Financeiro</h2>
            <p style="margin:0;color:#7a9ab5;font-size:15px;">${data.tournamentName}</p>
          </div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">
            Olá, <strong>${data.clubName}</strong>! O torneio <strong>${data.tournamentName}</strong> foi concluído. Aqui está o resumo financeiro.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#7a9ab5;text-transform:uppercase;letter-spacing:1px;">Resumo financeiro</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Total de atletas</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${data.totalAtletas}</strong></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;"><span style="color:#4a6580;font-size:14px;">Receita bruta</span></td><td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;"><strong style="color:#0d2037;font-size:14px;">${fmt(data.totalBruto)}</strong></td></tr>
                ${comissaoLinha}
                <tr><td style="padding:12px 0 8px;"><span style="color:#0d2037;font-size:15px;font-weight:700;">Valor a receber</span></td><td style="padding:12px 0 8px;text-align:right;"><strong style="color:#00ff88;font-size:18px;font-weight:800;">${fmt(data.valorRepasse)}</strong></td></tr>
              </table>
              ${data.comissao === 0 ? `<p style="margin:16px 0 0;padding:12px;background:#f0fff8;border-radius:8px;border-left:3px solid #00ff88;font-size:13px;color:#065f46;">✅ Durante o período de lançamento, a Bubble não cobra comissão. O valor total das inscrições pagas é integralmente seu.</p>` : `<p style="margin:16px 0 0;padding:12px;background:#fff8e1;border-radius:8px;border-left:3px solid #f59e0b;font-size:13px;color:#92400e;">⏳ O repasse será feito manualmente via PIX em até 3 dias úteis.</p>`}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#00ccff;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Ver dashboard financeiro →</a>
          </td></tr></table>
          <p style="margin:0;color:#4a6580;font-size:14px;line-height:1.6;">Dúvidas sobre o repasse? Responda este email ou entre em contato em privacidade@bubblepadel.com.</p>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
}

// ─── FUNÇÕES PÚBLICAS ─────────────────────────────────────────────────────────

export async function sendInscricaoConfirmada(
  data: InscricaoConfirmadaData,
): Promise<void> {
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🎾 Inscrição recebida — ${data.tournamentName}`,
    html: templateInscricaoConfirmada(data),
  });
}

export async function sendNovaInscricaoParaClube(
  data: NovaInscricaoData,
): Promise<void> {
  await sendEmail({
    to: data.clubEmail,
    subject: `Nova inscrição: ${data.player1Name} / ${data.player2Name} — ${data.tournamentName}`,
    html: templateNovaInscricaoClube(data),
  });
}

export async function sendLembreteTorneio(
  data: LembreteTorneioData,
): Promise<void> {
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🎾 Seu torneio é amanhã — ${data.tournamentName}`,
    html: templateLembreteTorneio(data),
  });
}

export async function sendEmailCampeao(data: ResultadoBaseData): Promise<void> {
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🏆 Campeões! Parabéns pela vitória em ${data.tournamentName}`,
    html: templateCampeao(data),
  });
}

export async function sendEmailVice(data: ResultadoBaseData): Promise<void> {
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🥈 Vice-campeões! Foi por muito pouco em ${data.tournamentName}`,
    html: templateVice(data),
  });
}

export async function sendEmailEliminadoPlayoffs(
  data: ResultadoBaseData,
): Promise<void> {
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🎾 Chegaram longe! Resultados de ${data.tournamentName}`,
    html: templateEliminadoPlayoffs(data),
  });
}

export async function sendEmailEliminadoGrupos(
  data: ResultadoBaseData,
): Promise<void> {
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🎾 Obrigado por participar de ${data.tournamentName}`,
    html: templateEliminadoGrupos(data),
  });
}

export async function sendRelatorioRepasse(
  data: RelatorioRepasseData,
): Promise<void> {
  await sendEmail({
    to: data.clubEmail,
    subject: `📊 Relatório financeiro — ${data.tournamentName}`,
    html: templateRelatorioRepasse(data),
  });
}

// ─── EMAIL PARA PARCEIRO (PIX) ────────────────────────────────────────────────

interface PixParceiroData {
  player2Email: string;
  player2Name: string;
  player1Name: string;
  tournamentName: string;
  category: string;
  amount: number;
  payLink: string;
}

export async function sendPixParaParceiro(
  data: PixParceiroData,
): Promise<void> {
  const html = `${emailHeader()}
        <tr><td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Finalize sua inscrição!</h2>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Olá, <strong>${data.player2Name}</strong>! <strong>${data.player1Name}</strong> te inscreveu como parceiro no torneio <strong>${data.tournamentName}</strong> (${data.category}).</p>
          <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">Para confirmar sua vaga, você precisa pagar sua parte: <strong style="color:#0d2037;">R$ ${data.amount.toFixed(2).replace(".", ",")}</strong></p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${data.payLink}" style="display:inline-block;background:#00ff88;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Pagar minha inscrição via PIX →</a>
          </td></tr></table>
          <p style="margin:0;color:#4a6580;font-size:13px;line-height:1.6;">Este link é válido por 7 dias. Se não reconhece esta inscrição, ignore este email.</p>
        </td></tr>
        ${emailFooter(FRONTEND())}`;
  await sendEmail({
    to: data.player2Email,
    subject: `🎾 ${data.player1Name} te inscreveu em ${data.tournamentName} — pague sua parte`,
    html,
  });
}
