import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, AlignmentType, BorderStyle,
} from 'docx';
import { buildReportContent } from '../data/reportContent';

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

const LEVEL_COLOR = { 심각: '#e5322a', 경고: '#d4780a', 주의: '#0066ff', 양호: '#0da34e' };

function reportHtml(report, content) {
  const { total, regions, hotspots, risk, overallAnalysis } = content;
  const meta = Object.entries(report)
    .filter(([k]) => ['cycle', 'period', 'date', 'author', 'status'].includes(k))
    .map(([k, v]) => {
      const labelMap = { cycle: '배포 주기', period: '분석 기간', date: '생성일', author: '생성자', status: '상태' };
      const valueMap = v === 'done' ? '완료' : v === 'wait' ? '대기' : v;
      return `<span style="margin-right:16px;">${labelMap[k] || k}: <b>${valueMap}</b></span>`;
    }).join('');

  return `
    <div style="font-family:var(--font-body, sans-serif);color:#171717;width:720px;padding:40px;background:#fff;">
      <div style="font-size:22px;font-weight:800;margin-bottom:6px;">${report.name}</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:4px;">제주 주차민원분석 솔루션 · 자동 생성 보고서</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:24px;">${meta}</div>

      <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">1. 총 민원 건수</div>
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:24px;padding:16px 18px;background:#f5f8ff;border-radius:10px;">
        <span style="font-size:28px;font-weight:800;">${total.count}건</span>
        <span style="font-size:13px;color:#0066ff;font-weight:700;">↗ ${total.deltaValue}</span>
        <span style="font-size:12px;color:#70737c;">${total.deltaLabel}</span>
      </div>

      <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">2. 지역별 민원현황</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
        <thead>
          <tr style="background:#f5f6f8;">
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">순위</th>
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">지역</th>
            <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #e5e6ea;">민원 건수</th>
            <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #e5e6ea;">전기 대비</th>
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">세부 유형</th>
          </tr>
        </thead>
        <tbody>
          ${regions.map((r) => `
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;">${r.num}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-weight:700;">${r.name}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right;">${r.value}건</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right;color:${r.dir === 'up' ? '#e5322a' : r.dir === 'down' ? '#0066ff' : '#70737c'};">${r.deltaLabel}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#70737c;">${r.breakdown.map(([l, v]) => `${l} ${v}`).join(' · ')}</td>
            </tr>`).join('')}
        </tbody>
      </table>

      <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">3. 민원집중구역</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
        <thead>
          <tr style="background:#f5f6f8;">
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">순위</th>
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">위치</th>
            <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e5e6ea;">위치 설명</th>
            <th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e5e6ea;">위험도</th>
          </tr>
        </thead>
        <tbody>
          ${hotspots.map((h) => `
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;">${h.rank}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-weight:700;">${h.name}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#70737c;">${h.meta}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">
                <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:${LEVEL_COLOR[h.level]};">${h.level}</span>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>

      <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">4. 위험단계 현황</div>
      <div style="display:flex;gap:10px;margin-bottom:24px;">
        ${Object.entries(risk).map(([label, cnt]) => `
          <div style="flex:1;padding:14px;border-radius:10px;background:#f7f7f8;text-align:center;">
            <div style="font-size:11px;color:#70737c;margin-bottom:4px;">${label}</div>
            <div style="font-size:20px;font-weight:800;color:${LEVEL_COLOR[label] || '#171717'};">${cnt}건</div>
          </div>`).join('')}
      </div>

      <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">5. 전체 분석 내용</div>
      <div style="font-size:13px;line-height:1.7;color:#333;padding:16px 18px;background:#fafafa;border-radius:10px;">${overallAnalysis}</div>
    </div>
  `;
}

/**
 * 보고서를 여러 섹션(총 민원건수/지역별 현황/집중구역/위험단계/전체분석)으로 구성해 PDF로 캡처.
 * 화면 렌더링을 그대로 캡처하므로 한글 폰트 임베딩 없이도 깨지지 않으며,
 * 내용이 길 경우 A4 페이지 단위로 자동 분할한다.
 */
export async function exportReportPdf(report, mode = 'save') {
  const content = buildReportContent(report);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;';
  host.innerHTML = reportHtml(report, content);
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

    if (mode === 'preview') {
      window.open(pdf.output('bloburl'), '_blank');
    } else {
      pdf.save(`${report.name}.pdf`);
    }
  } finally {
    host.remove();
  }
}

function sectionHeading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}

function simpleTable(headerCells, rows) {
  const noBorder = {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'E5E6EA' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E6EA' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
  const headerRow = new TableRow({
    children: headerCells.map((h) => new TableCell({
      borders: noBorder,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
    })),
  });
  const bodyRows = rows.map((cells) => new TableRow({
    children: cells.map((c) => new TableCell({
      borders: noBorder,
      children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 20 })] })],
    })),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] });
}

/**
 * 보고서를 .docx로 내보냄 (한글 워드프로세서 호환, 유니코드 네이티브 지원이라 폰트 임베딩 불필요).
 * PDF와 동일한 5개 섹션 구성.
 */
export async function exportReportDocx(report) {
  const { total, regions, hotspots, risk, overallAnalysis } = buildReportContent(report);

  const metaLine = Object.entries(report)
    .filter(([k]) => ['cycle', 'period', 'date', 'author', 'status'].includes(k))
    .map(([k, v]) => {
      const labelMap = { cycle: '배포 주기', period: '분석 기간', date: '생성일', author: '생성자', status: '상태' };
      const valueMap = v === 'done' ? '완료' : v === 'wait' ? '대기' : v;
      return `${labelMap[k] || k}: ${valueMap}`;
    }).join('   ·   ');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: report.name, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: '제주 주차민원분석 솔루션 · 자동 생성 보고서', color: '888888', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: metaLine, color: '888888', size: 18 })], spacing: { after: 120 } }),

        sectionHeading('1. 총 민원 건수'),
        new Paragraph({
          children: [
            new TextRun({ text: `${total.count}건  `, bold: true, size: 32 }),
            new TextRun({ text: `↗ ${total.deltaValue} (${total.deltaLabel})`, color: '0066FF', bold: true, size: 20 }),
          ],
        }),

        sectionHeading('2. 지역별 민원현황'),
        simpleTable(
          ['순위', '지역', '민원 건수', '전기 대비', '세부 유형'],
          regions.map((r) => [r.num, r.name, `${r.value}건`, r.deltaLabel, r.breakdown.map(([l, v]) => `${l} ${v}`).join(' · ')]),
        ),

        sectionHeading('3. 민원집중구역'),
        simpleTable(
          ['순위', '위치', '위치 설명', '위험도'],
          hotspots.map((h) => [h.rank, h.name, h.meta, h.level]),
        ),

        sectionHeading('4. 위험단계 현황'),
        simpleTable(
          Object.keys(risk),
          [Object.values(risk).map((v) => `${v}건`)],
        ),

        sectionHeading('5. 전체 분석 내용'),
        new Paragraph({ children: [new TextRun({ text: overallAnalysis, size: 20 })] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${report.name}.docx`);
}
