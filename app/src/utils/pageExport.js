import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, BorderStyle,
} from 'docx';

/* 범용 페이지 데이터 내보내기.
   data = {
     fileBase: 파일명(확장자 제외),
     title, subtitle,
     sections: [{ title, columns: [문자열...], rows: [[셀...]...] }],
   } */

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

function sectionsHtml({ title, subtitle, sections }) {
  return `
    <div style="font-family:var(--font-body, sans-serif);color:#171717;width:720px;padding:40px;background:#fff;">
      <div style="font-size:22px;font-weight:800;margin-bottom:6px;">${title}</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:4px;">제주 주차민원분석 솔루션</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:24px;">${subtitle}</div>

      ${sections.map((sec, i) => `
        <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">${i + 1}. ${sec.title}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
          <thead>
            <tr style="background:#f5f6f8;">
              ${sec.columns.map((c) => `<th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${sec.rows.map((row) => `
              <tr>
                ${row.map((cell, ci) => `<td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;${ci === 1 ? 'font-weight:700;' : ''}">${cell}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>`).join('')}
    </div>
  `;
}

/* 페이지 데이터를 PDF로 내보냄 (화면 캡처 방식, A4 자동 분할) */
export async function exportSectionsPdf(data) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;';
  host.innerHTML = sectionsHtml(data);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host.firstElementChild, { scale: 2, backgroundColor: '#fff' });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    const img = canvas.toDataURL('image/png');

    pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(`${data.fileBase}.pdf`);
  } finally {
    host.remove();
  }
}

/* 페이지 데이터를 DOCX로 내보냄 */
export async function exportSectionsDocx({ fileBase, title, subtitle, sections }) {
  const border = {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'E5E6EA' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E6EA' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
  const cell = (text, opts = {}) => new TableCell({
    borders: border,
    children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, ...opts })] })],
  });

  const children = [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun({ text: '제주 주차민원분석 솔루션', color: '888888', size: 20 })] }),
    new Paragraph({ children: [new TextRun({ text: subtitle, color: '888888', size: 18 })], spacing: { after: 120 } }),
  ];

  sections.forEach((sec, i) => {
    children.push(new Paragraph({ text: `${i + 1}. ${sec.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: sec.columns.map((h) => cell(h, { bold: true })) }),
        ...sec.rows.map((row) => new TableRow({
          children: row.map((c, ci) => cell(c, ci === 1 ? { bold: true } : {})),
        })),
      ],
    }));
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${fileBase}.docx`);
}
