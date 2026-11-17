import { useEffect, useState } from 'react';

/* AI 어시스턴트 만족도 조사 — 채팅 3건 초과 시 1회 노출.
   1~10 점수 선택 + 자유 의견. 제출 시 localStorage('aiSatisfaction')에 저장. */
export default function SatisfactionSurvey({ open, onClose, onSubmit }) {
  const [score, setScore] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 열릴 때 입력값 초기화
  useEffect(() => {
    if (open) { setScore(null); setOpinion(''); setDone(false); }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (score == null) return;
    const record = { score, opinion: opinion.trim(), at: new Date().toISOString() };
    try { localStorage.setItem('aiSatisfaction', JSON.stringify(record)); } catch { /* 저장 실패 무시 */ }
    onSubmit?.(record);
    setDone(true);
  };

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__dialog modal__dialog--sm" role="dialog" aria-modal="true" aria-label="AI 어시스턴트 만족도 조사">
        <div className="modal__head">
          <h2 className="modal__title">{done ? '참여해 주셔서 감사합니다' : 'AI 어시스턴트 만족도 조사'}</h2>
          <button className="modal__close" type="button" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {done ? (
          <>
            <div className="modal__body">
              <p className="survey__thanks">
                소중한 의견이 등록되었습니다. <strong>{score}점</strong>으로 평가해 주셨습니다.
                <br />더 나은 AI 어시스턴트를 위해 활용하겠습니다.
              </p>
            </div>
            <div className="modal__foot">
              <button className="btn btn--apply" type="button" onClick={onClose}>확인</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal__body">
              <p className="survey__lead">AI 어시스턴트 사용 경험은 어떠셨나요? 1점(매우 불만족)부터 10점(매우 만족)까지 선택해 주세요.</p>

              <div className="survey__scale" role="radiogroup" aria-label="만족도 점수 1에서 10">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={score === n}
                    className={`survey__num${score === n ? ' is-active' : ''}`}
                    onClick={() => setScore(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="survey__ends">
                <span>매우 불만족</span>
                <span>매우 만족</span>
              </div>

              <label className="survey__label" htmlFor="survey-opinion">의견 (선택)</label>
              <textarea
                id="survey-opinion"
                className="survey__textarea"
                rows={4}
                placeholder="개선할 점이나 좋았던 점을 자유롭게 남겨 주세요."
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
              />
            </div>
            <div className="modal__foot modal__foot--split">
              <button className="mt-act" type="button" onClick={onClose}>나중에</button>
              <button className="btn btn--apply" type="button" onClick={submit} disabled={score == null}>제출</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
