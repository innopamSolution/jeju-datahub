import Icon from './Icon';

/* 그룹 메뉴 하위 페이지의 경로 표시 (타이틀 위 브레드크럼).
   그룹은 별도 페이지가 없으므로 클릭 불가 텍스트로만 표시한다. */
export default function PageCrumb({ group, page }) {
  return (
    <p className="page-crumb">
      <span>{group}</span>
      <Icon name="chevron-right" size={12} />
      <span className="page-crumb__cur">{page}</span>
    </p>
  );
}
