import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, BorderStyle,
} from 'docx';

const FILE_BASE = '불법주차_집중구역_순위';
const TITLE = '불법 주차 집중 구역 순위';
const SUBTITLE = '종합점수 기준 : 민원 건수 60% / 단속 40%';

/* dotColor CSS 변수 → 등급 라벨/실색상 (PDF 캡처·DOCX 텍스트용) */
const GRADE = {
  'var(--red-50)':    { label: '심각', color: '#e5322a' },
  'var(--orange-50)': { label: '경고', color: '#d4780a' },
  'var(--blue-50)':   { label: '주의', color: '#0066ff' },
};

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

function hotspotHtml(ranking) {
  return `
    <div style="font-family:var(--font-body, sans-serif);color:#171717;width:720px;padding:40px;background:#fff;">
      <div style="font-size:22px;font-weight:800;margin-bottom:6px;">${TITLE}</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:4px;">제주 주차민원분석 솔루션 · 집중 구역 분석 결과</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:24px;">${SUBTITLE}</div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f5f6f8;">
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">순위</th>
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">구역</th>
            <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #e5e6ea;">종합점수</th>
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">세부 내역</th>
            <th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e5e6ea;">등급</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map((r) => {
            const g = GRADE[r.dotColor] ?? { label: '-', color: '#70737c' };
            return `
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;">${r.rank}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-weight:700;">${r.name}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;">${r.score}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#70737c;">${r.sub}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">
                <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:${g.color};">${g.label}</span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* 집중 구역 순위를 PDF로 내보냄 (화면 렌더링 캡처 방식이라 한글 폰트 임베딩 불필요, A4 자동 분할) */
export async function exportHotspotPdf(ranking) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;';
  host.innerHTML = hotspotHtml(ranking);
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
    pdf.save(`${FILE_BASE}.pdf`);
  } finally {
    host.remove();
  }
}

/* 집중 구역 순위를 DOCX로 내보냄 (유니코드 네이티브라 폰트 임베딩 불필요) */
export async function exportHotspotDocx(ranking) {
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

  const headerRow = new TableRow({
    children: ['순위', '구역', '종합점수', '세부 내역', '등급'].map((h) => cell(h, { bold: true })),
  });
  const rows = ranking.map((r) => {
    const g = GRADE[r.dotColor] ?? { label: '-' };
    return new TableRow({
      children: [cell(r.rank), cell(r.name, { bold: true }), cell(r.score, { bold: true }), cell(r.sub), cell(g.label)],
    });
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: TITLE, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: '제주 주차민원분석 솔루션 · 집중 구역 분석 결과', color: '888888', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: SUBTITLE, color: '888888', size: 18 })], spacing: { after: 240 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${FILE_BASE}.docx`);
}
