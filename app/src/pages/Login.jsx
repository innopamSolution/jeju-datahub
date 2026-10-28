import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* 로그인 — 제주 데이터허브 로그인 화면(data-hub …/login)과 동일한 구성.
   목업이므로 입력값 검증 없이 두 버튼 모두 대시보드로 이동한다 */
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const field = {
    width: '100%', height: 44, padding: '0 12px', boxSizing: 'border-box',
    border: '1px solid var(--line-normal)', borderRadius: 8,
    background: 'var(--card-bg)', fontSize: 14, color: 'var(--text-strong)',
    outline: 'none',
  };
  const label = { display: 'block', fontSize: 13, color: 'var(--text-neutral)', margin: '0 0 8px' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fill-normal)' }}>
      <form
        style={{ width: 320, padding: '48px 0' }}
        onSubmit={(e) => { e.preventDefault(); navigate('/'); }}
      >
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
            width: '100%', height: 44, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: 'var(--primary-normal)', color: '#fff', fontSize: 14, fontWeight: 600,
          }}
        >
          통합 인증으로 로그인
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--line-normal)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>또는</span>
          <span style={{ flex: 1, height: 1, background: 'var(--line-normal)' }} />
        </div>

        <label style={label} htmlFor="login-email">이메일</label>
        <input id="login-email" type="email" style={{ ...field, marginBottom: 16 }}
          value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />

        <label style={label} htmlFor="login-password">비밀번호</label>
        <input id="login-password" type="password" style={{ ...field, marginBottom: 20 }}
          value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

        <button
          type="submit"
          style={{
            width: '100%', height: 44, borderRadius: 8, cursor: 'pointer',
            border: '1px solid var(--line-normal)', background: 'var(--card-bg)',
            fontSize: 14, fontWeight: 600, color: 'var(--text-strong)',
          }}
        >
          로그인
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-alternative)', lineHeight: 1.6 }}>
          이메일 로그인에는 <b style={{ color: 'var(--text-neutral)' }}>SSO·2단계 인증이 적용되지 않습니다.</b><br />
          다른 DHub 서비스와 로그인이 연동되지 않으니, 가능하면 위의 통합 인증을 이용해 주세요.
        </p>
      </form>
    </div>
  );
}
