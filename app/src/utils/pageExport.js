import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, BorderStyle, ImageRun,
} from 'docx';

/* 범용 페이지 리포트 내보내기.
   data = {
     fileBase, title, subtitle,
     sections: [
       { type: 'table', title, columns: [..], rows: [[..]] },
       { type: 'chart', title, html },              // 인라인 div 차트 (막대 등)
       { type: 'chart', title, image: {dataUrl, width, height} }, // 캡처된 차트 이미지
     ],
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

/* ---------- 차트 HTML 빌더 (html2canvas가 렌더 가능한 순수 div 차트) ---------- */

/* 가로 막대 차트: items = [{label, value, valueLabel, color?}] */
export function hBarChartHtml(items) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${items.map((i) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:11px;">
          <span style="width:96px;flex-shrink:0;color:#171717;font-weight:600;text-align:right;">${i.label}</span>
          <div style="flex:1;height:14px;background:#f0f1f3;border-radius:999px;overflow:hidden;">
            <div style="width:${(i.value / max) * 100}%;height:100%;border-radius:999px;background:${i.color ?? '#0066ff'};"></div>
          </div>
          <span style="width:72px;flex-shrink:0;color:#70737c;">${i.valueLabel}</span>
        </div>`).join('')}
    </div>`;
}

/* 누적 막대 차트: items = [{label, valueLabel, segments: [{pct, color}]}] */
export function stackBarChartHtml(items) {
  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${items.map((i) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:11px;">
          <span style="width:96px;flex-shrink:0;color:#171717;font-weight:600;text-align:right;">${i.label}</span>
          <div style="flex:1;display:flex;height:14px;border-radius:999px;overflow:hidden;background:#f0f1f3;">
            ${i.segments.map((s) => `<div style="width:${s.pct}%;background:${s.color};"></div>`).join('')}
          </div>
          <span style="width:72px;flex-shrink:0;color:#70737c;">${i.valueLabel}</span>
        </div>`).join('')}
    </div>`;
}

/* SVG/이미지 dataURL → PNG dataURL (ECharts svg 렌더러 출력 대응) */
export async function toPngDataUrl(dataUrl, scale = 2) {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  return { dataUrl: c.toDataURL('image/png'), width: w, height: h };
}

/* ---------- PDF ---------- */

function sectionBodyHtml(sec) {
  if (sec.type === 'chart') {
    if (sec.image) {
      return `<img src="${sec.image.dataUrl}" style="width:100%;height:auto;display:block;" />`;
    }
    return sec.html;
  }
  return `
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
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
    </table>`;
}

function docHtml({ title, subtitle, sections }) {
  return `
    <div style="font-family:var(--font-body, sans-serif);color:#171717;width:720px;padding:40px;background:#fff;">
      <div style="font-size:22px;font-weight:800;margin-bottom:6px;">${title}</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:4px;">제주 주차민원분석 솔루션</div>
      <div style="font-size:12px;color:#70737c;margin-bottom:24px;">${subtitle}</div>
      ${sections.map((sec, i) => `
        <div style="font-size:15px;font-weight:700;margin:0 0 10px;border-left:4px solid #0066ff;padding-left:10px;">${i + 1}. ${sec.title}</div>
        <div style="margin-bottom:24px;">${sectionBodyHtml(sec)}</div>`).join('')}
    </div>`;
}

/* 페이지 리포트를 PDF로 내보냄 (표 + 차트, 화면 캡처 방식, A4 자동 분할) */
export async function exportSectionsPdf(data) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;';
  host.innerHTML = docHtml(data);
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

/* ---------- DOCX ---------- */

function base64ToBytes(dataUrl) {
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* html 조각을 offscreen 렌더 후 PNG로 래스터화 (DOCX 차트 삽입용) */
async function rasterizeHtml(html, width = 640) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;background:#fff;padding:8px;`;
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#fff' });
    return { dataUrl: canvas.toDataURL('image/png'), width, height: Math.round(canvas.height / 2) };
  } finally {
    host.remove();
  }
}

/* 페이지 리포트를 DOCX로 내보냄 (표는 네이티브, 차트는 PNG 이미지로 삽입) */
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

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    children.push(new Paragraph({ text: `${i + 1}. ${sec.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }));

    if (sec.type === 'chart') {
      const img = sec.image ?? await rasterizeHtml(sec.html);
      const docW = 600;
      const docH = Math.round((img.height / img.width) * docW);
      children.push(new Paragraph({
        children: [new ImageRun({
          type: 'png',
          data: base64ToBytes(img.dataUrl),
          transformation: { width: docW, height: docH },
        })],
      }));
    } else {
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: sec.columns.map((h) => cell(h, { bold: true })) }),
          ...sec.rows.map((row) => new TableRow({
            children: row.map((c, ci) => cell(c, ci === 1 ? { bold: true } : {})),
          })),
        ],
      }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${fileBase}.docx`);
}
