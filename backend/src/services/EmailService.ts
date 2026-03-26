import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Bubble Padel <onboarding@resend.dev>";
const DEV_MODE =
  !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test";

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
    // Falha no email nunca deve bloquear o fluxo principal
    console.error("❌ [EMAIL] Erro:", err);
  }
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

function templateInscricaoConfirmada(data: InscricaoConfirmadaData): string {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/tournaments/${data.tournamentId}`;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição recebida</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#050f1a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#00ff88;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Bubble Padel</h1>
            <p style="margin:8px 0 0;color:#7a9ab5;font-size:14px;">Gestão de Torneios</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Inscrição recebida!</h2>
            <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">
              Sua inscrição no torneio foi registrada com sucesso. Aguarde a confirmação do organizador.
            </p>

            <!-- Info Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;padding:0;margin-bottom:24px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#7a9ab5;text-transform:uppercase;letter-spacing:1px;">Detalhes da inscrição</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;">
                        <span style="color:#4a6580;font-size:14px;">Torneio</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.tournamentName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;">
                        <span style="color:#4a6580;font-size:14px;">Data</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.tournamentDate}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;">
                        <span style="color:#4a6580;font-size:14px;">Categoria</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.category}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;">
                        <span style="color:#4a6580;font-size:14px;">Jogador 1</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.player1Name}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#4a6580;font-size:14px;">Jogador 2</span>
                      </td>
                      <td style="padding:8px 0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.player2Name}</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin:16px 0 0;padding:12px;background:#fff8e1;border-radius:8px;border-left:3px solid #f59e0b;font-size:13px;color:#92400e;">
                    ⏳ <strong>Status: Aguardando confirmação</strong> — o organizador irá confirmar sua dupla em breve.
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="${url}" style="display:inline-block;background:#00ff88;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">
                    Ver página do torneio →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#4a6580;font-size:14px;line-height:1.6;">
              Dúvidas? Entre em contato com o organizador do torneio pela página acima.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e0e8f0;text-align:center;">
            <p style="margin:0;color:#7a9ab5;font-size:12px;">
              Bubble Padel · <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/termos" style="color:#7a9ab5;">Termos de Uso</a> · <a href="mailto:privacidade@bubblepadel.com" style="color:#7a9ab5;">privacidade@bubblepadel.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function templateNovaInscricaoClube(data: NovaInscricaoData): string {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard/tournaments/${data.tournamentId}?tab=inscricoes`;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Nova inscrição recebida</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        
        <tr>
          <td style="background:#050f1a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#00ff88;font-size:24px;font-weight:800;">Bubble Padel</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Nova inscrição recebida!</h2>
            <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">
              Uma nova dupla se inscreveu no seu torneio <strong>${data.tournamentName}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;">
                        <span style="color:#4a6580;font-size:14px;">Categoria</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.category}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;">
                        <span style="color:#4a6580;font-size:14px;">Jogador 1</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #e0e8f0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.player1Name}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#4a6580;font-size:14px;">Jogador 2</span>
                      </td>
                      <td style="padding:8px 0;text-align:right;">
                        <strong style="color:#0d2037;font-size:14px;">${data.player2Name}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="${url}" style="display:inline-block;background:#00ccff;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">
                    Gerenciar inscrições →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e0e8f0;text-align:center;">
            <p style="margin:0;color:#7a9ab5;font-size:12px;">Bubble Padel · privacidade@bubblepadel.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── FUNÇÕES PÚBLICAS ─────────────────────────────────────────────────────────

export async function sendInscricaoConfirmada(
  data: InscricaoConfirmadaData,
): Promise<void> {
  const html = templateInscricaoConfirmada(data);
  // Envia para AMBOS os jogadores da dupla
  await sendEmail({
    to: [data.player1Email, data.player2Email],
    subject: `🎾 Inscrição recebida — ${data.tournamentName}`,
    html,
  });
}

export async function sendNovaInscricaoParaClube(
  data: NovaInscricaoData,
): Promise<void> {
  const html = templateNovaInscricaoClube(data);
  await sendEmail({
    to: data.clubEmail,
    subject: `Nova inscrição: ${data.player1Name} / ${data.player2Name} — ${data.tournamentName}`,
    html,
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
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Pague sua inscrição</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#050f1a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#00ff88;font-size:24px;font-weight:800;">Bubble Padel</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 8px;color:#0d2037;font-size:22px;font-weight:700;">🎾 Finalize sua inscrição!</h2>
            <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">
              Olá, <strong>${data.player2Name}</strong>! <strong>${data.player1Name}</strong> te inscreveu como parceiro no torneio <strong>${data.tournamentName}</strong> (${data.category}).
            </p>
            <p style="margin:0 0 24px;color:#4a6580;font-size:15px;line-height:1.6;">
              Para confirmar sua vaga, você precisa pagar sua parte: <strong style="color:#0d2037;">R$ ${data.amount.toFixed(2).replace(".", ",")}</strong>
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="${data.payLink}" style="display:inline-block;background:#00ff88;color:#050f1a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">
                    Pagar minha inscrição via PIX →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#4a6580;font-size:13px;line-height:1.6;">
              Este link é válido por 7 dias. Se não reconhece esta inscrição, ignore este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e0e8f0;text-align:center;">
            <p style="margin:0;color:#7a9ab5;font-size:12px;">Bubble Padel · privacidade@bubblepadel.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: data.player2Email,
    subject: `🎾 ${data.player1Name} te inscreveu em ${data.tournamentName} — pague sua parte`,
    html,
  });
}
