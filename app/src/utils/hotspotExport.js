import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, BorderStyle,
} from 'docx';

const FILE_BASE = '불법주차_집중구역_순위';
const TITLE = '불법 주차 집중 구역 순위';
/* meta: { period, wc } — 분석 기간·적용 가중치 (미전달 시 기본값) */
function metaLines(meta = {}) {
  const period = meta.period || '최근 1개월';
  const wc = meta.wc ?? 60;
  return {
    period: `분석 기간 : ${period}`,
    weight: `종합점수 기준 : 민원 건수 ${wc}% / 단속 건수 ${100 - wc}%${wc !== 60 ? ' (가중치 조정 적용)' : ''}`,
    basis: [
      '구역은 반경 50m 내 3개 지점 이상의 민원·단속 위치를 묶은 것입니다(DBSCAN).',
      '종합점수(0~100) = 월평균 민원·단속 건수를 기준값 대비 점수화해 가중합한 값입니다.',
      '등급 : 심각 80점 이상 · 경고 60~79점 · 주의 40~59점 — 주의 이상 구역만 표시됩니다.',
    ],
  };
}

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

function hotspotHtml(ranking, meta) {
  const m = metaLines(meta);
  return `
    <div style="font-family:var(--font-body, sans-serif);color:#171717;width:720px;padding:40px;background:#fff;">
      <div style="font-size:22px;font-weight:800;margin-bottom:6px;">${TITLE}</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:4px;">제주 주차민원분석 솔루션 · 집중 구역 분석 결과</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:2px;">${m.period}</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:24px;">${m.weight}</div>

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

      <div style="margin-top:20px;padding:14px 16px;background:#f5f6f8;border-radius:8px;">
        <div style="font-size:12px;font-weight:800;margin-bottom:6px;">점수 산정 기준</div>
        ${m.basis.map((b) => `<div style="font-size:11px;color:#555;line-height:1.7;">· ${b}</div>`).join('')}
      </div>
    </div>
  `;
}

/* 집중 구역 순위를 PDF로 내보냄 (화면 렌더링 캡처 방식이라 한글 폰트 임베딩 불필요, A4 자동 분할) */
export async function exportHotspotPdf(ranking, meta) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;';
  host.innerHTML = hotspotHtml(ranking, meta);
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
export async function exportHotspotDocx(ranking, meta) {
  const m = metaLines(meta);
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
        new Paragraph({ children: [new TextRun({ text: m.period, color: '888888', size: 18 })] }),
        new Paragraph({ children: [new TextRun({ text: m.weight, color: '888888', size: 18 })], spacing: { after: 240 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] }),
        new Paragraph({ children: [new TextRun({ text: '점수 산정 기준', bold: true, size: 20 })], spacing: { before: 300, after: 80 } }),
        ...m.basis.map((b) => new Paragraph({ children: [new TextRun({ text: `· ${b}`, size: 18, color: '555555' })] })),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${FILE_BASE}.docx`);
}

/* 집중 구역 순위를 XLSX로 내보냄 — B3(민원 가중치) 셀을 바꾸면 종합점수·등급·순위가 수식으로 재계산된다 */
export async function exportHotspotXlsx(ranking, meta = {}) {
  const m = metaLines(meta);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('집중구역 분석');
  ws.columns = [
    { width: 8 }, { width: 24 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 34 },
  ];

  ws.getCell('A1').value = '불법 주차 집중 구역 순위';
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getCell('A2').value = m.period;

  ws.getCell('A3').value = '민원 건수 가중치';
  const wCell = ws.getCell('B3');
  wCell.value = (meta.wc ?? 60) / 100;
  wCell.numFmt = '0%';
  wCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
  wCell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
  ws.getCell('C3').value = '← 이 셀을 바꾸면 종합점수·등급·순위가 자동 재계산됩니다 (0~100%)';
  ws.getCell('C3').font = { color: { argb: 'FF888888' }, size: 10 };
  ws.getCell('A4').value = '단속 건수 가중치';
  ws.getCell('B4').value = { formula: '1-B3' };
  ws.getCell('B4').numFmt = '0%';

  const HDR = 6;
  const header = ['순위', '구역', '민원 점수', '단속 점수', '종합점수', '등급', '세부 내역'];
  header.forEach((h, i) => {
    const c = ws.getRow(HDR).getCell(i + 1);
    c.value = h; c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  });

  const n = ranking.length;
  ranking.forEach((r, i) => {
    const row = ws.getRow(HDR + 1 + i);
    const ri = HDR + 1 + i;
    row.getCell(1).value = { formula: `RANK(E${ri},$E$${HDR + 1}:$E$${HDR + n})` };
    row.getCell(2).value = r.name;
    row.getCell(3).value = r.cs;
    row.getCell(4).value = r.es;
    row.getCell(5).value = { formula: `ROUND(C${ri}*$B$3+D${ri}*(1-$B$3),0)` };
    row.getCell(6).value = { formula: `IF(E${ri}>=80,"심각",IF(E${ri}>=60,"경고",IF(E${ri}>=40,"주의","-")))` };
    row.getCell(7).value = r.sub;
  });

  let nr = HDR + n + 2;
  ws.getCell(`A${nr}`).value = '점수 산정 기준';
  ws.getCell(`A${nr}`).font = { bold: true };
  m.basis.forEach((b, i) => { ws.getCell(`A${nr + 1 + i}`).value = `· ${b}`; ws.getCell(`A${nr + 1 + i}`).font = { size: 10, color: { argb: 'FF555555' } }; });

  const buf = await wb.xlsx.writeBuffer();
  saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${FILE_BASE}.xlsx`);
}
