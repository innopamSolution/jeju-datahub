import { useNavigate } from 'react-router-dom';

/* 로그인 — 제주 데이터허브(D-Hub) 통합 인증으로만 로그인.
   실제 구현에서는 버튼 클릭 시 D-Hub 로그인 창으로 이동하며, 목업에서는 대시보드로 이동 */
export default function Login() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fill-normal)' }}>
      <div style={{ width: 320, padding: '48px 0' }}>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-alternative)', margin: '0 0 8px' }}>
          제주 스마트시티 데이터 허브
        </p>
        <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', margin: '0 0 32px', lineHeight: 1.35 }}>
          주차민원분석 솔루션
        </h1>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            width: '100%', height: 48, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: 'var(--primary-normal)', color: '#fff', fontSize: 15, fontWeight: 600,
          }}
        >
          통합 인증으로 로그인
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-alternative)', textAlign: 'center', lineHeight: 1.6 }}>
          제주 데이터허브(D-Hub) 통합 인증 로그인 창으로 이동합니다.
        </p>
      </div>
    </div>
  );
}
