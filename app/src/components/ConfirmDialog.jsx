import { useEffect } from 'react';

/* 삭제 확인 공통 모달 — open이 참일 때만 렌더.
   message 예: "저장된 시나리오를 삭제하시겠습니까?" (아래 고정 경고문이 함께 표시됨) */
export default function ConfirmDialog({ open, message, confirmLabel = '삭제', onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal">
      <div className="modal__overlay" onClick={onCancel} />
      <div className="modal__dialog modal__dialog--sm" role="alertdialog" aria-modal="true" aria-label={message}>
        <div className="modal__body" style={{ padding: '28px 28px 20px' }}>
          <p style={{ margin: 0, fontSize: 'var(--body1-size)', fontWeight: 'var(--weight-bold)', color: 'var(--text-strong)' }}>{message}</p>
          <p style={{ margin: '8px 0 0', fontSize: 'var(--label1-size)', color: 'var(--text-neutral)' }}>삭제하면 되돌릴 수 없습니다.</p>
        </div>
        <div className="modal__foot modal__foot--split" style={{ paddingTop: 0 }}>
          <button className="btn" type="button" style={{ height: 44 }} onClick={onCancel}>취소</button>
          <button className="btn" type="button"
            style={{ height: 44, color: 'var(--red-50)', borderColor: 'var(--red-90)' }}
            onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
