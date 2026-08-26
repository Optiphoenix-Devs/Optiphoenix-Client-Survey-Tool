/**
 * Branded HTML email templates for OptiPhoenix transactional mail.
 *
 * Light is the default (best Gmail support). Dark mode uses
 * `@media (prefers-color-scheme: dark)` where the email client allows it
 * (Apple Mail, iOS, some Outlook). Gmail often keeps the light layout.
 */

import { getAppBaseUrl } from "@/lib/app-url";

type EmailShellInput = {
  preheader: string;
  title: string;
  greeting: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandHeader(baseUrl: string) {
  const logoUrl = `${baseUrl}/optiphoenix-logo-email.svg`;
  return `
    <tr>
      <td style="padding:28px 32px 12px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;padding-right:12px;">
              <img
                src="${logoUrl}"
                width="160"
                height="26"
                alt="OptiPhoenix"
                style="display:block;border:0;outline:none;text-decoration:none;height:26px;width:auto;max-width:160px;"
              />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderEmailShell(input: EmailShellInput) {
  const baseUrl = getAppBaseUrl();
  const cta = input.cta
    ? `
      <tr>
        <td style="padding:8px 32px 8px 32px;">
          <a href="${escapeHtml(input.cta.href)}"
             class="btn"
             style="display:inline-block;padding:12px 20px;background:#1c3d2e;color:#f4efe4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;line-height:1;text-decoration:none;border-radius:999px;">
            ${escapeHtml(input.cta.label)}
          </a>
        </td>
      </tr>`
    : "";

  const footerNote = input.footerNote
    ? `<p class="muted" style="margin:0 0 8px 0;color:#3d4f44;font-size:13px;line-height:1.5;">${input.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(input.title)}</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin:0; padding:0; background:#f9f8f3; }
    .wrapper { background:#f9f8f3; }
    .card { background:#ffffff; border:1px solid #d8d4c8; }
    .title { color:#14261c; }
    .text { color:#14261c; }
    .muted { color:#3d4f44; }
    .btn { background:#1c3d2e !important; color:#f4efe4 !important; }
    .rule { border-top:1px solid #d8d4c8; }
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background:#101814 !important; }
      .card { background:#18241d !important; border-color:#2c3f34 !important; }
      .title, .text { color:#f4efe4 !important; }
      .muted { color:#b5c2ba !important; }
      .btn { background:#8faf97 !important; color:#101814 !important; }
      .rule { border-top-color:#2c3f34 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f9f8f3;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f8f3;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #d8d4c8;border-radius:16px;overflow:hidden;">
          ${brandHeader(baseUrl)}
          <tr>
            <td style="padding:8px 32px 0 32px;">
              <h1 class="title" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:#14261c;">
                ${escapeHtml(input.title)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <p class="text" style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#14261c;">
                ${escapeHtml(input.greeting)}
              </p>
              <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#14261c;">
                ${input.bodyHtml}
              </div>
            </td>
          </tr>
          ${cta}
          <tr>
            <td style="padding:24px 32px 28px 32px;">
              <div class="rule" style="border-top:1px solid #d8d4c8;padding-top:16px;">
                ${footerNote}
                <p class="muted" style="margin:0;color:#3d4f44;font-size:12px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  © ${new Date().getFullYear()} OptiPhoenix · Client Survey Tool
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmail(input: {
  name?: string | null;
  resetUrl: string;
}) {
  const name = input.name?.trim() || "there";
  const html = renderEmailShell({
    preheader: "Reset your OptiPhoenix password",
    title: "Reset your password",
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">We received a request to reset your OptiPhoenix password.</p>
      <p style="margin:0 0 12px 0;">Click the button below to choose a new one. If you didn’t ask for this, you can ignore this email.</p>
    `,
    cta: { label: "Reset password", href: input.resetUrl },
    footerNote: `Or paste this link into your browser:<br /><a href="${escapeHtml(input.resetUrl)}" style="color:#1c3d2e;word-break:break-all;">${escapeHtml(input.resetUrl)}</a>`,
  });

  const text =
    `Hi ${name},\n\n` +
    `We received a request to reset your OptiPhoenix password.\n` +
    `Open this link to set a new password:\n${input.resetUrl}\n\n` +
    `If you didn’t request this, you can ignore this email.\n`;

  return {
    subject: "Reset your OptiPhoenix password",
    text,
    html,
  };
}

export function accountApprovedEmail(input: {
  name?: string | null;
  loginUrl: string;
}) {
  const name = input.name?.trim() || "there";
  const html = renderEmailShell({
    preheader: "Your OptiPhoenix account is approved",
    title: "You're approved",
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;"><strong>Good news</strong> — your OptiPhoenix account has been approved by an admin.</p>
      <p style="margin:0 0 12px 0;">You can sign in and start managing teams, forms, and client feedback.</p>
    `,
    cta: { label: "Log in to OptiPhoenix", href: input.loginUrl },
  });

  const text =
    `Hi ${name},\n\n` +
    `Good news — your OptiPhoenix account has been approved.\n` +
    `Log in here: ${input.loginUrl}\n`;

  return {
    subject: "Your OptiPhoenix account is approved",
    text,
    html,
  };
}

export function feedbackSubmittedEmail(input: {
  recipientName?: string | null;
  formTitle: string;
  clientName?: string | null;
  responsesUrl: string;
}) {
  const name = input.recipientName?.trim() || "there";
  const client = input.clientName?.trim() || "—";
  const html = renderEmailShell({
    preheader: `New feedback on ${input.formTitle}`,
    title: "New client feedback",
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">A client just submitted feedback.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0 4px 0;border-collapse:collapse;">
        <tr>
          <td class="muted" style="padding:8px 0;color:#3d4f44;font-size:13px;width:88px;vertical-align:top;">Form</td>
          <td class="text" style="padding:8px 0;color:#14261c;font-size:14px;font-weight:600;">${escapeHtml(input.formTitle)}</td>
        </tr>
        <tr>
          <td class="muted" style="padding:8px 0;color:#3d4f44;font-size:13px;vertical-align:top;">Client</td>
          <td class="text" style="padding:8px 0;color:#14261c;font-size:14px;font-weight:600;">${escapeHtml(client)}</td>
        </tr>
      </table>
    `,
    cta: { label: "View responses", href: input.responsesUrl },
  });

  const text =
    `Hi ${name},\n\n` +
    `A client just submitted feedback.\n\n` +
    `Form: ${input.formTitle}\n` +
    `Client: ${client}\n` +
    `Link: ${input.responsesUrl}\n`;

  return {
    subject: `New client feedback submitted: ${input.formTitle}`,
    text,
    html,
  };
}
