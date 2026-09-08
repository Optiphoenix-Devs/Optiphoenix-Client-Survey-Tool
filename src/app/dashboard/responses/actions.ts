"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getResponsesPage,
  getResponsesForExport,
  type ResponsesPageResult,
  type ResponseExportRow,
} from "@/lib/responses";
import { RESPONSE_PAGE_SIZE } from "@/lib/page-size";
import type { DirectorySort } from "@/lib/sort";

export async function fetchResponsesPageAction(options: {
  page: number;
  query?: string;
  formId?: string;
  sort?: DirectorySort;
}): Promise<ResponsesPageResult | { error: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  try {
    return await getResponsesPage(session.user.id, session.user.role, {
      page: options.page,
      pageSize: RESPONSE_PAGE_SIZE,
      query: options.query,
      formId: options.formId,
      sort: options.sort,
    });
  } catch {
    return { error: "Could not load responses." };
  }
}

export async function exportResponsesAction(options: {
  clientId?: string;
  formId?: string;
}): Promise<ResponseExportRow[] | { error: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  try {
    return await getResponsesForExport(session.user.id, session.user.role, {
      clientId: options.clientId,
      formId: options.formId,
    });
  } catch {
    return { error: "Could not export responses." };
  }
}



