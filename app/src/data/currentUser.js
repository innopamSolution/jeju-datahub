/* 데모용 로그인 사용자 목(mock). 실제 인증 연동 전까지 권한 분기 기준으로 사용한다. */
export const CURRENT_USER = { name: '홍길동', dept: '제주시 주차 정책과', role: 'admin' };

export const isAdmin = () => CURRENT_USER.role === 'admin';
