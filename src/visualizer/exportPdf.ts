import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportSimulationSummaryPDF() {
  const pdf = new jsPDF('p', 'pt', 'a4')
  const margin = 40
  let y = margin

  const title = 'SentientZone Simulation Summary – 30 Day Case Study'
  pdf.setFontSize(18)
  pdf.text(title, margin, y)
  y += 30

  const summaryElem = document.querySelector('[data-sim-summary]')
  if (summaryElem) {
    const canvas = await html2canvas(summaryElem as HTMLElement)
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', margin, y, 520, 140)
    y += 150
  }

  const charts = document.querySelectorAll('canvas')
  for (let i = 0; i < charts.length && y < 750; i++) {
    const canvas = charts[i]
    const img = canvas.toDataURL('image/png')
    pdf.addImage(img, 'PNG', margin, y, 520, 120)
    y += 130
  }

  pdf.save('sentientzone_sim_summary.pdf')
}

