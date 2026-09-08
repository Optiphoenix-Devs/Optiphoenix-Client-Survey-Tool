import type { ResponseExportRow } from "@/lib/responses";

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function downloadResponsesCsv(
  rows: ResponseExportRow[],
  filenamePrefix = "responses-export"
) {
  const headers = [
    "Sr No",
    "Team Name",
    "Client Name",
    "Client Email",
    "Form Title",
    "Question Answer",
    "Submitted On",
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvField).join(","));

  for (const row of rows) {
    const fields = [
      row.srNo,
      row.teamName,
      row.clientName,
      row.clientEmail,
      row.formTitle,
      row.questionAnswer,
      row.submittedOn,
    ];
    csvRows.push(fields.map(escapeCsvField).join(","));
  }

  const csvString = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}-${dateStr}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
