import { format } from "date-fns";
import {
  DelayReportResponse,
  DelayReportFreightResponse,
  DepotReasonReportResponse,
} from "@/api/types/delays";

interface ExportDelayReportsParams {
  mainReportData: DelayReportResponse | DelayReportFreightResponse | null;
  depotReasonData: DepotReasonReportResponse | null;
  startDate: string;
  endDate: string;
  serviceType: "passenger" | "freight";
}

export function exportDelayReportsToDoc({
  mainReportData,
  depotReasonData,
  startDate,
  endDate,
  serviceType,
}: ExportDelayReportsParams) {
  if (!mainReportData) {
    alert("Ma'lumotlar mavjud emas. Iltimos, avval hisobotni yuklang.");
    return;
  }

  // Format dates for title
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Month names in Russian genitive case
  const monthNames = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  
  // Determine train type label
  const trainTypeLabel =
    serviceType === "freight" ? "ГРУЗОВЫХ" : "ПАССАЖИРСКИХ";

  // Format date range for title (like "за 10 месяца 2025 года")
  // If same month, show "за X месяца YYYY года", otherwise show range
  let dateRangeText = "";
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    dateRangeText = `за ${start.getDate()} ${startMonth} ${start.getFullYear()} года`;
  } else {
    dateRangeText = `за период с ${start.getDate()} ${startMonth} по ${end.getDate()} ${endMonth} ${end.getFullYear()} года`;
  }

  // Create HTML content
  let htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Справка по срывам</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>90</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
<w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="false" DefSemiHidden="false" DefQFormat="false" DefPriority="99" LatentStyleCount="376">
<w:LsdException Locked="false" Priority="0" SemiHidden="false" UnhideWhenUsed="false" QFormat="true" Name="Normal"/>
</w:LatentStyles>
</xml>
<![endif]-->
<style>
@page {
  size: landscape;
  margin: 0.3cm;
}
body {
  font-family: "Roboto", Arial, sans-serif;
  font-size: 7pt;
  line-height: 1;
  margin: 0;
  padding: 4px;
  width: 100%;
}
.title {
  text-align: center;
  font-weight: bold;
  font-size: 9pt;
  line-height: 1;
  margin-bottom: 6px;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 8px;
  font-size: 6pt;
  table-layout: fixed;
}
table th, table td {
  border: 1px solid #000;
  padding: 1px 2px;
  text-align: center;
  vertical-align: middle;
  font-size: 6pt;
  line-height: 1;
}
table th:first-child, table td:first-child {
  text-align: left;
}
table th {
  background-color: #e0e0e0;
  font-weight: bold;
}
table .header-dark {
  background-color: #d0d0d0;
}
table .total-row {
  background-color: #e0e0e0;
  font-weight: bold;
}
table .total-col {
  background-color: #d0d0d0;
  font-weight: bold;
}
.summary {
  margin: 5px 0;
  font-size: 9pt;
  line-height: 1;
  text-align: center;
}
.footer {
  margin-top: 15px;
  text-align: right;
  font-size: 9pt;
  line-height: 1;
}
<!--[if gte mso 9]>
div.Section1 {
  page: Section1;
}
@page Section1 {
  size: 11.69in 8.27in;
  margin: 0.3in 0.3in 0.3in 0.3in;
  mso-header-margin: 0.3in;
  mso-footer-margin: 0.3in;
  mso-paper-source: 0;
  mso-orientation: landscape;
}
<![endif]-->
</style>
</head>
<body>
<!--[if gte mso 9]>
<div class="Section1">
<![endif]-->
<div class="title">СПРАВКА по срывам с графика движения ${trainTypeLabel} поездов ${dateRangeText}</div>
`;

  // Add main report table
  if (serviceType === "freight" && "v_tom_chisle" in mainReportData.rows[0]) {
    // Freight table with complex headers
    const freightData = mainReportData as DelayReportFreightResponse;
    htmlContent += generateFreightTable(freightData);
  } else {
    // Passenger table
    const passengerData = mainReportData as DelayReportResponse;
    htmlContent += generatePassengerTable(passengerData);
  }

  // Add depot reason reports table
  if (depotReasonData) {
    htmlContent += generateDepotReasonTable(depotReasonData);
  }

  // Add footer
  htmlContent += `
<div class="footer">Начальник управления по эксплуатации локомотивов<br>Туляганов Ш.Т.</div>
<!--[if gte mso 9]>
</div>
<w:sectPr>
<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
<w:pgMar w:top="567" w:right="567" w:bottom="567" w:left="567" w:header="567" w:footer="567" w:gutter="0"/>
</w:sectPr>
<![endif]-->
</body>
</html>
`;

  // Create blob and download
  const blob = new Blob(
    [
      "\ufeff", // UTF-8 BOM for Word
      htmlContent,
    ],
    { type: "application/msword" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Справка_по_срывам_${format(new Date(), "yyyy-MM-dd")}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generatePassengerTable(data: DelayReportResponse): string {
  let html = `
<table>
<thead>
<tr>
<th rowspan="2">Депо</th>
<th colspan="3">По отправлению</th>
<th colspan="3">По проследованию</th>
<th colspan="3" class="header-dark">Всего</th>
</tr>
<tr>
<th>Кол-во</th>
<th>Время</th>
<th>Ущерб</th>
<th>Кол-во</th>
<th>Время</th>
<th>Ущерб</th>
<th class="header-dark">Кол-во</th>
<th class="header-dark">Время</th>
<th class="header-dark">Ущерб</th>
</tr>
</thead>
<tbody>
`;

  // Data rows
  data.rows.forEach((row) => {
    html += `
<tr>
<td>${row.depo}</td>
<td>${row.po_otpravleniyu.count}</td>
<td>${row.po_otpravleniyu.total_delay_time}</td>
<td>${formatNumber(row.po_otpravleniyu.total_damage)}</td>
<td>${row.po_prosledovaniyu.count}</td>
<td>${row.po_prosledovaniyu.total_delay_time}</td>
<td>${formatNumber(row.po_prosledovaniyu.total_damage)}</td>
<td class="total-col">${row.total.count}</td>
<td class="total-col">${row.total.total_delay_time}</td>
<td class="total-col">${formatNumber(row.total.total_damage)}</td>
</tr>
`;
  });

  // Total row
  if (data.total) {
    html += `
<tr class="total-row">
<td><strong>${data.total.depo}</strong></td>
<td><strong>${data.total.po_otpravleniyu.count}</strong></td>
<td><strong>${data.total.po_otpravleniyu.total_delay_time}</strong></td>
<td><strong>${formatNumber(data.total.po_otpravleniyu.total_damage)}</strong></td>
<td><strong>${data.total.po_prosledovaniyu.count}</strong></td>
<td><strong>${data.total.po_prosledovaniyu.total_delay_time}</strong></td>
<td><strong>${formatNumber(data.total.po_prosledovaniyu.total_damage)}</strong></td>
<td class="total-col"><strong>${data.total.total.count}</strong></td>
<td class="total-col"><strong>${data.total.total.total_delay_time}</strong></td>
<td class="total-col"><strong>${formatNumber(data.total.total.total_damage)}</strong></td>
</tr>
`;
  }

  html += `</tbody></table>`;
  return html;
}

function generateFreightTable(data: DelayReportFreightResponse): string {
  let html = `
<table>
<thead>
<tr>
<th rowspan="3">ДЕПО</th>
<th colspan="3">По отправлению</th>
<th colspan="3">По проследованию</th>
<th colspan="3" class="header-dark">Всего</th>
<th colspan="6">В том числе:</th>
</tr>
<tr>
<th rowspan="2">Кол-во</th>
<th rowspan="2">Время</th>
<th rowspan="2">Сумма</th>
<th rowspan="2">Кол-во</th>
<th rowspan="2">Время</th>
<th rowspan="2">Сумма</th>
<th rowspan="2" class="header-dark">Кол-во</th>
<th rowspan="2" class="header-dark">Время</th>
<th rowspan="2" class="header-dark">Сумма</th>
<th colspan="2">нет электровоза</th>
<th colspan="2">нет тепловоза</th>
<th colspan="2" class="header-dark">по вине депо</th>
</tr>
<tr>
<th>Кол-во</th>
<th>Время</th>
<th>Кол-во</th>
<th>Время</th>
<th class="header-dark">Кол-во</th>
<th class="header-dark">Время</th>
</tr>
</thead>
<tbody>
`;

  // Data rows
  data.rows.forEach((row) => {
    html += `
<tr>
<td>${row.depo}</td>
<td>${row.po_otpravleniyu.count}</td>
<td>${row.po_otpravleniyu.total_delay_time}</td>
<td>${formatNumber(row.po_otpravleniyu.total_damage)}</td>
<td>${row.po_prosledovaniyu.count}</td>
<td>${row.po_prosledovaniyu.total_delay_time}</td>
<td>${formatNumber(row.po_prosledovaniyu.total_damage)}</td>
<td class="total-col">${row.total.count}</td>
<td class="total-col">${row.total.total_delay_time}</td>
<td class="total-col">${formatNumber(row.total.total_damage)}</td>
<td>${row.v_tom_chisle.net_elektrovaza.count}</td>
<td>${row.v_tom_chisle.net_elektrovaza.total_delay_time}</td>
<td>${row.v_tom_chisle.net_teplovaza.count}</td>
<td>${row.v_tom_chisle.net_teplovaza.total_delay_time}</td>
<td class="total-col">${row.v_tom_chisle.po_vine_depo.count}</td>
<td class="total-col">${row.v_tom_chisle.po_vine_depo.total_delay_time}</td>
</tr>
`;
  });

  // Total row
  if (data.total) {
    html += `
<tr class="total-row">
<td><strong>${data.total.depo}</strong></td>
<td><strong>${data.total.po_otpravleniyu.count}</strong></td>
<td><strong>${data.total.po_otpravleniyu.total_delay_time}</strong></td>
<td><strong>${formatNumber(data.total.po_otpravleniyu.total_damage)}</strong></td>
<td><strong>${data.total.po_prosledovaniyu.count}</strong></td>
<td><strong>${data.total.po_prosledovaniyu.total_delay_time}</strong></td>
<td><strong>${formatNumber(data.total.po_prosledovaniyu.total_damage)}</strong></td>
<td class="total-col"><strong>${data.total.total.count}</strong></td>
<td class="total-col"><strong>${data.total.total.total_delay_time}</strong></td>
<td class="total-col"><strong>${formatNumber(data.total.total.total_damage)}</strong></td>
<td><strong>${data.total.v_tom_chisle.net_elektrovaza.count}</strong></td>
<td><strong>${data.total.v_tom_chisle.net_elektrovaza.total_delay_time}</strong></td>
<td><strong>${data.total.v_tom_chisle.net_teplovaza.count}</strong></td>
<td><strong>${data.total.v_tom_chisle.net_teplovaza.total_delay_time}</strong></td>
<td class="total-col"><strong>${data.total.v_tom_chisle.po_vine_depo.count}</strong></td>
<td class="total-col"><strong>${data.total.v_tom_chisle.po_vine_depo.total_delay_time}</strong></td>
</tr>
`;
  }

  html += `</tbody></table>`;
  return html;
}

function generateDepotReasonTable(data: DepotReasonReportResponse): string {
  const headers = data.headers || [];
  const columnHeaders = headers.slice(1); // Skip first header (row label)

  let html = "";

  // Summary text
  if (data.summary) {
    html += `
<div class="summary">
<strong>Всего по вине локомотивных депо ${data.summary.total_cases} сл. На ${data.summary.total_delay_time_formatted} в т.ч. по причинам:</strong>
</div>
`;
  }

  html += `
<table>
<thead>
<tr>
<th>${headers[0] || "Причина задержки поездов"}</th>
`;

  columnHeaders.forEach((header, index) => {
    const isLast = index === columnHeaders.length - 1;
    html += `<th${isLast ? ' class="header-dark"' : ""}>${header}</th>`;
  });

  html += `</tr></thead><tbody>`;

  // Data rows
  data.rows.forEach((row) => {
    html += `<tr><td>${row.reason_label}</td>`;
    columnHeaders.forEach((key, index) => {
      const value = row[key] as number | string | undefined;
      const isLast = index === columnHeaders.length - 1;
      html += `<td${isLast ? ' class="total-col"' : ""}>${value ?? 0}</td>`;
    });
    html += `</tr>`;
  });

  // Total row
  if (data.total) {
    html += `<tr class="total-row"><td><strong>${data.total.reason_label}</strong></td>`;
    columnHeaders.forEach((key, index) => {
      const value = data.total[key] as number | string | undefined;
      const isLast = index === columnHeaders.length - 1;
      html += `<td${isLast ? ' class="total-col"' : ""}><strong>${value ?? 0}</strong></td>`;
    });
    html += `</tr>`;
  }

  html += `</tbody></table>`;
  return html;
}

function formatNumber(num: number): string {
  return num?.toFixed(1)?.replace(".", ",") || "0";
}
