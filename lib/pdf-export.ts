import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ComponentData {
  component: string;
  factory_number: string | null;
  date_info: string | null;
}

interface LocomotiveData {
  name: string;
  model_name?: string;
  locomotive_model?: {
    name: string;
  } | null;
}

export async function exportLocomotivePassportPDF(
  locomotive: LocomotiveData,
  components: ComponentData[],
  sectionName?: string
): Promise<void> {
  // Create a temporary HTML element with the table
  const modelName =
    locomotive.model_name || locomotive.locomotive_model?.name || "";
  let title = `${locomotive.name}${sectionName ? `- ${sectionName}` : ""}${
    modelName ? `-${modelName}` : ""
  }`;

  // Create a container div - A4 size at 96 DPI: 794px x 1123px
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // A4 width in pixels at 96 DPI (210mm)
  container.style.height = "1123px"; // A4 height in pixels at 96 DPI (297mm)
  container.style.padding = "30px"; // Equal padding on all sides
  container.style.boxSizing = "border-box";
  container.style.fontFamily = "Arial, 'DejaVu Sans', sans-serif";
  container.style.backgroundColor = "white";
  container.style.color = "black";
  container.style.fontSize = "8px";
  container.style.overflow = "hidden";

  // Title
  const titleElement = document.createElement("h1");
  titleElement.textContent = title;
  titleElement.style.fontSize = "14px";
  titleElement.style.fontWeight = "bold";
  titleElement.style.textAlign = "center";
  titleElement.style.marginBottom = "24px";
  titleElement.style.marginTop = "0";
  titleElement.style.padding = "0";
  titleElement.style.lineHeight = "1.2";
  container.appendChild(titleElement);

  // Create table - full width with equal padding
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.fontSize = "9px";
  table.style.border = "0.5px solid #666";
  table.style.tableLayout = "fixed";
  table.style.margin = "0";

  // Table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.style.backgroundColor = "#f0f0f0";
  headerRow.style.borderBottom = "0.5px solid #666";
  headerRow.style.height = "20px";

  const headers = [
    "№",
    "Асосий узел ва агрегатлар номи",
    "Завод Раками",
    "Таьмир ёки И.Ч. Кили",
  ];
  const headerWidths = ["4%", "52%", "22%", "22%"];

  // Calculate row height first
  const maxComponents = 50;
  const availableHeight = 1123 - 60 - 38; // page - padding - title
  const headerHeight = 20;
  const rowHeight = Math.floor(
    (availableHeight - headerHeight) / maxComponents
  );

  headers.forEach((header, index) => {
    const th = document.createElement("th");
    th.style.border = "0.5px solid #666";
    th.style.padding = "0";
    th.style.fontWeight = "bold";
    th.style.width = headerWidths[index];
    th.style.verticalAlign = "middle";
    th.style.display = "table-cell";
    th.style.height = `${headerHeight}px`;
    th.style.position = "relative";

    const wrapper = document.createElement("div");
    wrapper.textContent = header;
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = index === 0 ? "center" : "flex-start";
    wrapper.style.height = "100%";
    wrapper.style.padding = `0 6px`;
    wrapper.style.textAlign = index === 0 ? "center" : "left";

    th.appendChild(wrapper);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  components.forEach((component, index) => {
    const row = document.createElement("tr");
    row.style.height = `${rowHeight}px`; // Dynamic compact row height
    if (index % 2 === 0) {
      row.style.backgroundColor = "#fafafa";
    }

    // Helper function to create centered cell
    const createCell = (text: string, align: "left" | "center" = "left") => {
      const cell = document.createElement("td");
      cell.style.border = "0.5px solid #666";
      cell.style.padding = "0";
      cell.style.verticalAlign = "middle";
      cell.style.display = "table-cell";
      cell.style.height = `${rowHeight}px`;
      cell.style.position = "relative";

      const wrapper = document.createElement("div");
      wrapper.textContent = text;
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent =
        align === "center" ? "center" : "flex-start";
      wrapper.style.height = "100%";
      wrapper.style.padding = `0 6px`;
      wrapper.style.textAlign = align;
      wrapper.style.overflow = "hidden";
      wrapper.style.textOverflow = "ellipsis";
      wrapper.style.whiteSpace = "nowrap";

      cell.appendChild(wrapper);
      return cell;
    };

    const rowNumber = createCell(String(index + 1), "center");
    row.appendChild(rowNumber);

    const componentName = createCell(component.component, "left");
    row.appendChild(componentName);

    const factoryNumber = createCell(component.factory_number || "0", "left");
    row.appendChild(factoryNumber);

    const dateInfo = createCell(component.date_info || "0", "left");
    row.appendChild(dateInfo);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Append to body temporarily
  document.body.appendChild(container);

  try {
    // Convert to canvas - use higher scale for better quality
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      height: 1123,
    });

    // Remove temporary element
    document.body.removeChild(container);

    // Create PDF - fit to one page
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit exactly on one page
    // A4: 210mm x 297mm
    const imgWidth = pdfWidth; // Full width
    const imgHeight = pdfHeight; // Full height

    // Add image to fit the entire page
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    // Save the PDF
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_passport.pdf`;
    pdf.save(fileName);
  } catch (error) {
    // Remove temporary element in case of error
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}
