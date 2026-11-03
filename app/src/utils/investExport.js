import ExcelJS from 'exceljs';

/* 투자·보강 우선순위를 XLSX로 내보냄 — B3~B6(지표 가중치)을 바꾸면 종합점수·우선순위·순위가 수식으로 재계산된다 */
export async function exportInvestXlsx(lots, meta = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('투자보강 우선순위');
  ws.columns = [{ width: 8 }, { width: 22 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 26 }, { width: 8 }, { width: 14 }];

  ws.getCell('A1').value = '공영주차장 투자·보강 우선순위';
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getCell('A2').value = `분석 기간 : ${meta.period ?? '최근 1개월'} (사고 이력은 최근 3개월 기준)`;

  const W = [['안전위험도', 0.25], ['민원빈도', 0.25], ['이용패턴', 0.25], ['사고이력', 0.25]];
  W.forEach(([label, v], i) => {
    const r = 3 + i;
    ws.getCell(`A${r}`).value = `${label} 가중치`;
    const c = ws.getCell(`B${r}`);
    c.value = v; c.numFmt = '0%';
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  ws.getCell('A7').value = '가중치 합계';
  ws.getCell('B7').value = { formula: 'SUM(B3:B6)' };
  ws.getCell('B7').numFmt = '0%';
  ws.getCell('C3').value = '← 노란 셀을 바꾸면 종합점수·우선순위·순위가 자동 재계산됩니다 (합계 100% 권장)';
  ws.getCell('C3').font = { color: { argb: 'FF888888' }, size: 10 };

  const HDR = 9;
  const header = ['순위', '주차장', '안전위험도', '민원빈도', '이용패턴', '사고이력', '종합점수', '우선순위', '주소', '면수', '준공연도'];
  header.forEach((h, i) => {
    const c = ws.getRow(HDR).getCell(i + 1);
    c.value = h; c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  });

  const n = lots.length;
  lots.forEach((lot, i) => {
    const ri = HDR + 1 + i;
    const row = ws.getRow(ri);
    row.getCell(1).value = { formula: `RANK(G${ri},$G$${HDR + 1}:$G$${HDR + n})` };
    row.getCell(2).value = lot.name;
    row.getCell(3).value = lot.m.safety;
    row.getCell(4).value = lot.m.civil;
    row.getCell(5).value = lot.m.usage;
    row.getCell(6).value = lot.m.accident;
    row.getCell(7).value = { formula: `ROUND(C${ri}*$B$3+D${ri}*$B$4+E${ri}*$B$5+F${ri}*$B$6,0)` };
    row.getCell(8).value = { formula: `IF(G${ri}>=80,"높음",IF(G${ri}>=60,"중간","낮음"))` };
    row.getCell(9).value = lot.addr;
    row.getCell(10).value = lot.spaces;
    row.getCell(11).value = `${lot.year} (${lot.age}년 경과)`;
  });

  let nr = HDR + n + 2;
  ws.getCell(`A${nr}`).value = '산정 기준';
  ws.getCell(`A${nr}`).font = { bold: true };
  [
    '종합점수 = 안전위험도·민원빈도·이용패턴·사고이력 지표 점수(0~100)의 가중합 — 기본 가중치는 각 25%이며 설정 > 분석 지표 가중치 설정에서 변경할 수 있습니다.',
    '우선순위 : 높음 80점 이상 · 중간 60~79점 · 낮음 60점 미만',
  ].forEach((b, i) => {
    ws.getCell(`A${nr + 1 + i}`).value = `· ${b}`;
    ws.getCell(`A${nr + 1 + i}`).font = { size: 10, color: { argb: 'FF555555' } };
  });

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = '투자보강_우선순위.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
