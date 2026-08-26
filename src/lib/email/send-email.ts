"use server";

import { Resend } from "resend";
import { getAppBaseUrl } from "@/lib/app-url";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Email helper used by server actions.
 *
 * If RESEND_API_KEY is not configured, we no-op (so local dev still works).
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
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch (err) {
    console.error("[email] Failed to send email", {
      to: input.to,
      subject: input.subject,
      err,
    });
  }
}
