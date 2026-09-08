import { readFile } from "fs/promises";
import path from "path";
import { Resend } from "resend";
import { getAppBaseUrl } from "@/lib/app-url";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const LOGO_CONTENT_ID = "optiphoenix-logo";

export class EmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailSendError";
  }
}

async function getLogoAttachment() {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "optiphoenix-logo-email.png"
    );
    const content = await readFile(logoPath);
    return {
      filename: "optiphoenix-logo-email.png",
      content,
      contentId: LOGO_CONTENT_ID,
      contentType: "image/png",
    };
  } catch (err) {
    console.warn("[email] Could not load logo attachment", err);
    return null;
  }
}

function friendlyResendMessage(message: string | undefined) {
  const raw = message?.trim() || "Email provider rejected the send.";
  if (
    /only send testing emails to your own email/i.test(raw) ||
    /verify a domain/i.test(raw)
  ) {
    return (
      "Email isn’t set up for other recipients yet. In Resend, verify your domain " +
      "and set EMAIL_FROM to an address on that domain (not onboarding@resend.dev)."
    );
  }
  return raw;
}

/**
 * Email helper used by server actions.
 *
 * If RESEND_API_KEY is not configured, we no-op (so local dev still works).
 * Throws EmailSendError when the provider rejects the send.
 */
export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.warn(
      "[email] Skipping email send (missing RESEND_API_KEY or EMAIL_FROM).",
      { to: input.to, subject: input.subject, baseUrl: getAppBaseUrl() }
    );
    return;
  }

  const resend = new Resend(apiKey);
  const logo = input.html ? await getLogoAttachment() : null;

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    ...(logo ? { attachments: [logo] } : {}),
  });

  if (error) {
    console.error("[email] Failed to send email", {
      to: input.to,
      subject: input.subject,
      error,
    });
    throw new EmailSendError(friendlyResendMessage(error.message));
  }
}
