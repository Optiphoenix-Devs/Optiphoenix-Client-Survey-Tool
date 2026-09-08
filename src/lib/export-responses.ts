import type { ResponseExportRow } from "@/lib/responses";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportFormat = "csv" | "xlsx" | "pdf";

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function getDateSuffix(): string {
  return new Date().toISOString().split("T")[0];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportAsCsv(rows: ResponseExportRow[], filenamePrefix = "responses-export") {
  const headers = [
    "Sr No",
    "Team Name",
    "Client Name",
    "Client Email",
    "Form Title",
    "Question/Answer",
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

  triggerDownload(blob, `${filenamePrefix}-${getDateSuffix()}.csv`);
}

export function exportAsXlsx(rows: ResponseExportRow[], filenamePrefix = "responses-export") {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:FontName="Calibri" ss:Size="11"/>
   <Interior ss:Color="#1F4D3A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#14261C"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#14261C"/>
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED8CB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED8CB"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterDataCell">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#14261C"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED8CB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED8CB"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Survey Responses">
  <Table>
   <Column ss:Width="50"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="160"/>
   <Column ss:Width="150"/>
   <Column ss:Width="360"/>
   <Column ss:Width="150"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Sr No</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Team Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Client Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Client Email</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Form Title</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Question/Answer</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Submitted On</Data></Cell>
   </Row>`;

  for (const row of rows) {
    xml += `
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="CenterDataCell"><Data ss:Type="Number">${row.srNo}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.teamName)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.clientName)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.clientEmail)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.formTitle)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.questionAnswer)}</Data></Cell>
    <Cell ss:StyleID="CenterDataCell"><Data ss:Type="String">${escapeXml(row.submittedOn)}</Data></Cell>
   </Row>`;
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  triggerDownload(blob, `${filenamePrefix}-${getDateSuffix()}.xls`);
}

export function exportAsPdf(rows: ResponseExportRow[], filenamePrefix = "responses-report") {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.setTextColor(31, 77, 58);
  doc.text("OptiPhoenix — Survey Responses Report", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}`, 40, 56);

  const tableData = rows.map((row) => [
    row.srNo,
    row.teamName,
    `${row.clientName}\n(${row.clientEmail})`,
    row.formTitle,
    row.questionAnswer,
    row.submittedOn,
  ]);

  autoTable(doc, {
    startY: 70,
    head: [["#", "Team Name", "Client Details", "Form Title", "Question/Answer", "Submitted On"]],
    body: tableData,
    headStyles: {
      fillColor: [31, 77, 58],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      1: { cellWidth: 90 },
      2: { cellWidth: 120 },
      3: { cellWidth: 120 },
      4: { cellWidth: 280 },
      5: { cellWidth: 100, halign: "center" },
    },
    theme: "striped",
  });

  doc.save(`${filenamePrefix}-${getDateSuffix()}.pdf`);
}
