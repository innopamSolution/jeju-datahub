import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, AlignmentType,
} from 'docx';

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 보고서 카드 하나를 렌더링해 PDF로 캡처.
 * 화면 렌더링을 그대로 캡처하므로 한글 폰트 임베딩 없이도 깨지지 않음.
 */
export async function exportReportPdf(report, fields, mode = 'save') {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:640px;background:#fff;padding:32px;font-family:var(--font-body, sans-serif);color:#171717;';
  host.innerHTML = `
    <div style="font-size:20px;font-weight:800;margin-bottom:4px;">${report.name}</div>
    <div style="font-size:12px;color:#70737c;margin-bottom:20px;">제주 주차민원분석 솔루션 · 자동 생성 보고서</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${fields.map(([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#70737c;width:120px;">${label}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#171717;font-weight:600;">${value}</td>
        </tr>`).join('')}
    </table>
  `;
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#fff' });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height);
    if (mode === 'preview') {
      window.open(pdf.output('bloburl'), '_blank');
    } else {
      pdf.save(`${report.name}.pdf`);
    }
  } finally {
    host.remove();
  }
}

/**
 * 보고서를 .docx로 내보냄 (한글 워드프로세서 호환, 유니코드 네이티브 지원이라 폰트 임베딩 불필요).
 */
export async function exportReportDocx(report, fields) {
  const rows = fields.map(([label, value]) => new TableRow({
    children: [
      new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: label })] }),
      new TableCell({ width: { size: 75, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: String(value) })] }),
    ],
  }));

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: report.name, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          children: [new TextRun({ text: '제주 주차민원분석 솔루션 · 자동 생성 보고서', color: '888888', size: 20 })],
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({ text: '' }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${report.name}.docx`);
}
