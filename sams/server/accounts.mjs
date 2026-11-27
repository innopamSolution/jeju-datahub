// 관리자 계정(아이디·비밀번호) 저장. 비밀번호는 원문이 아니라 scrypt 로 계산한 값만 DB 에 둔다.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const DEFAULT_DB = path.join(path.dirname(new URL(import.meta.url).pathname), 'data', 'store.sqlite');

export function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('CREATE TABLE IF NOT EXISTS docs (name TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at INTEGER NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, created_at INTEGER NOT NULL)');
  return db;
}

const KEYLEN = 64;
const hashOf = (pw, salt) => crypto.scryptSync(String(pw), salt, KEYLEN).toString('hex');

export const MIN_PASSWORD = 8;
export const validId = (id) => /^[A-Za-z0-9._@-]{2,40}$/.test(id);

export function setAdmin(db, id, pw) {
  if (!validId(id)) throw new Error('아이디는 영문·숫자·. _ @ - 로 2~40자여야 합니다');
  if (String(pw).length < MIN_PASSWORD) throw new Error(`비밀번호는 ${MIN_PASSWORD}자 이상이어야 합니다`);
  const salt = crypto.randomBytes(16).toString('hex');
  db.prepare('INSERT INTO admins (id, salt, hash, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET salt = excluded.salt, hash = excluded.hash').run(id, salt, hashOf(pw, salt), Date.now());
}
export const removeAdmin = (db, id) => db.prepare('DELETE FROM admins WHERE id = ?').run(id).changes > 0;
export const listAdmins = (db) => db.prepare('SELECT id, created_at FROM admins ORDER BY created_at').all();
export const countAdmins = (db) => db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;

// 없는 아이디도 같은 시간을 들여 계산해서, 응답 시간으로 아이디가 있는지 알아내지 못하게 한다.
const DUMMY_SALT = crypto.randomBytes(16).toString('hex');
export function verifyAdmin(db, id, pw) {
  const row = db.prepare('SELECT salt, hash FROM admins WHERE id = ?').get(String(id));
  const got = Buffer.from(hashOf(pw, row ? row.salt : DUMMY_SALT), 'hex');
  const want = Buffer.from(row ? row.hash : '0'.repeat(KEYLEN * 2), 'hex');
  return !!row && got.length === want.length && crypto.timingSafeEqual(got, want);
}
