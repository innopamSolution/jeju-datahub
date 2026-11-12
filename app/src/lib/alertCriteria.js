import { useSyncExternalStore } from 'react';

// 위험단계 알림 '알림 기준' 공유 스토어
// - 위험단계 알림 관리(AlertManagement)에서 저장하면
//   위험단계 알림 조회(AlertInquiry)의 판정 기준 안내에 즉시 반영된다.
// - localStorage에 보존하여 새로고침 후에도 유지.
const KEY = 'alertCriteria';
const DEFAULT = { severe: 30, warn: 20, caution: 10, minCount: 10 };

function normalize(v) {
  const num = (x, d) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : d;
  };
  return {
    severe: num(v?.severe, DEFAULT.severe),
    warn: num(v?.warn, DEFAULT.warn),
    caution: num(v?.caution, DEFAULT.caution),
    minCount: num(v?.minCount, DEFAULT.minCount),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

let state = load();
const listeners = new Set();

export function getCriteria() {
  return state;
}

export function setCriteria(next) {
  state = normalize({ ...state, ...next });
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore storage errors (private mode 등) */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  // 다른 탭에서 변경된 경우도 반영
  const onStorage = (e) => {
    if (e.key === KEY) {
      state = load();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useCriteria() {
  return useSyncExternalStore(subscribe, getCriteria, getCriteria);
}
