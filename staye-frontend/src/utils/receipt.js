const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 10;

export async function downloadReceiptAsPdf(element, filename) {
  if (!element) return;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  let canvas;
  try {
    canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    const contentWidth = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;
    const pageContentHeight = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
    const pdf = new jsPDF("p", "mm", "a4");

    let remainingHeight = contentHeight;
    let offsetY = PAGE_MARGIN_MM;

    while (remainingHeight > 0) {
      pdf.addImage(imageData, "JPEG", PAGE_MARGIN_MM, offsetY, contentWidth, contentHeight);
      remainingHeight -= pageContentHeight;

      if (remainingHeight > 0) {
        pdf.addPage();
        offsetY -= pageContentHeight;
      }
    }

    pdf.save(filename);
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
