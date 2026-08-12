#!/usr/bin/env node
// 교차 참조 검사.
//
// CLAUDE.md가 "손으로 고쳐야 한다"고 적어 둔 규칙들을 기계가 대신 본다.
// 라벨·번호·상수를 한쪽만 고쳤을 때 조용히 어긋나는 자리를 잡는 것이 전부이고,
// 화면이 예쁜지는 보지 못한다 — 스크린샷 확인을 대신하지 않는다.
//
//   node tools/check.mjs
//
// 통과하면 0, 하나라도 어긋나면 1로 끝난다.

import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const html = read("index.html");
const readme = read("README.md");
const claude = read("CLAUDE.md");

const results = [];
let group = "";
const g = (name) => { group = name; };
const ok = (name) => results.push({ group, name, ok: true });
const bad = (name, ...detail) => results.push({ group, name, ok: false, detail });
const check = (name, fn) => {
  let out;
  try { out = fn(); } catch (e) { return bad(name, `검사가 터졌습니다: ${e.message}`); }
  return out == null || out === true ? ok(name) : bad(name, ...[].concat(out));
};
const setEq = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const lineAt = (src, i) => src.slice(0, i).split("\n").length;
// 주석 속 언급인가. CLAUDE.md의 금지 규칙은 주석으로도 설명되므로 그건 걸러야 한다
const inComment = (src, i) => {
  const start = src.lastIndexOf("\n", i) + 1;
  const slashes = [...src.slice(start, i).matchAll(/\/\//g)];
  return slashes.some((m) => src[start + m.index - 1] !== ":");   // https:// 는 주석이 아니다
};

// ─────────────────────────────────────────────────────────────
// 추출
// ─────────────────────────────────────────────────────────────

// 헤더의 시나리오 버튼: <button data-mode="commit" ...><i>1</i>Commit</button>
const headerBtns = [...html.matchAll(
  /<button\s+data-mode="(\w+)"[^>]*>(?:<i>(\d+)<\/i>)?([^<]*)<\/button>/g
)].map(([, mode, num, label]) => ({ mode, num: num ? +num : null, label: label.trim() }))
  .filter((b) => b.mode !== "free");

// const SCEN_ORDER = [["commit","Commit"], ...];
const orderSrc = html.match(/const\s+SCEN_ORDER\s*=\s*\[([\s\S]*?)\];/);
const scenOrder = orderSrc
  ? [...orderSrc[1].matchAll(/\[\s*"(\w+)"\s*,\s*"([^"]+)"\s*\]/g)].map(([, k, l]) => ({ key: k, label: l }))
  : [];

// const SCEN = { commit: { ... }, merge: { ... } } — 두 칸 들여쓴 키만 시나리오다
const scenSrc = html.slice(html.indexOf("const SCEN = {"), html.indexOf("const SCEN_ORDER"));
const scenKeys = [...scenSrc.matchAll(/^ {2}(\w+):\s*\{/gm)].map(([, k]) => k);

// 조작판 버튼 전체 (id="btn…")
const buttons = [...html.matchAll(/<button([^>]*\bid="btn\w+"[^>]*)>([^<]*)<\/button>/g)]
  .map(([, attrs, label]) => ({
    id: attrs.match(/id="(btn\w+)"/)?.[1] ?? "?",
    title: attrs.match(/title="([^"]*)"/)?.[1] ?? "",
    label: label.trim(),
  }));
const labels = buttons.map((b) => b.label);
// git 명령에 대응하는 버튼 = 라벨이 소문자 라틴 문자로만 된 것 (CLAUDE.md 1절 3번)
const isCmdLabel = (l) => /^[a-z]+(?: -[a-z])?$/.test(l);

const num = (name) => {
  const m = html.match(new RegExp(`\\b${name}\\s*=\\s*(-?\\d+)`));
  return m ? +m[1] : null;
};

// ─────────────────────────────────────────────────────────────
// 1. 시나리오 정합성 — SCEN · SCEN_ORDER · 헤더 버튼 · 본문 번호
// ─────────────────────────────────────────────────────────────
g("시나리오 정합성");

check("SCEN의 키와 SCEN_ORDER의 키가 같다", () => {
  const a = scenKeys, b = scenOrder.map((s) => s.key);
  if (setEq(a, b)) return true;
  const only = (x, y) => x.filter((k) => !y.includes(k));
  return [
    only(a, b).length ? `SCEN에만 있음: ${only(a, b).join(", ")} — 여기 빠지면 그 시나리오만 끝에서 아무 안내 없이 멈춥니다` : null,
    only(b, a).length ? `SCEN_ORDER에만 있음: ${only(b, a).join(", ")}` : null,
  ].filter(Boolean);
});

check("SCEN_ORDER 순서와 헤더 버튼 순서가 같다", () => {
  const a = scenOrder.map((s) => s.key).join(" → ");
  const b = headerBtns.map((s) => s.mode).join(" → ");
  return a === b || [`SCEN_ORDER: ${a}`, `헤더 버튼:   ${b}`, "HTML 순서가 화면 순서입니다 (CLAUDE.md 3절)"];
});

check("헤더 버튼 번호가 1부터 차례로 붙어 있다", () => {
  const wrong = headerBtns.filter((b, i) => b.num !== i + 1);
  return !wrong.length || wrong.map((b) => `${b.mode}: <i>${b.num}</i> — ${headerBtns.indexOf(b) + 1}이어야 합니다`);
});

check("헤더 버튼 라벨과 SCEN_ORDER 라벨이 같다", () => {
  const wrong = headerBtns
    .map((b, i) => [b, scenOrder[i]])
    .filter(([b, s]) => s && b.label !== s.label);
  return !wrong.length || wrong.map(([b, s]) => `${b.mode}: 버튼 "${b.label}" ↔ SCEN_ORDER "${s.label}"`);
});

check("모든 시나리오가 title과 steps를 갖는다", () => {
  const bodies = scenSrc.split(/^ {2}(?=\w+:\s*\{)/m).slice(1);
  const missing = bodies
    .map((b) => ({ key: b.match(/^(\w+):/)[1], has: ["title", "steps"].filter((f) => new RegExp(`^ {4}${f}:`, "m").test(b)) }))
    .filter((x) => x.has.length < 2);
  return !missing.length || missing.map((x) => `${x.key}: ${["title", "steps"].filter((f) => !x.has.includes(f)).join(", ")} 없음`);
});

// 본문이 "3번 Conflict"처럼 번호로 시나리오를 부르는 자리 (안내 28·29단계 등)
const numberOf = (label) => scenOrder.findIndex((s) => s.label === label) + 1;

check("안내 본문의 「N번 이름」이 실제 번호와 맞는다", () => {
  const refs = [...html.matchAll(/(\d+)번 ([A-Za-z]+)/g)]
    .map((m) => ({ n: +m[1], label: m[2], line: lineAt(html, m.index) }))
    .filter((r) => numberOf(r.label) > 0);
  const wrong = refs.filter((r) => r.n !== numberOf(r.label));
  return !wrong.length || wrong.map((r) => `index.html:${r.line} "${r.n}번 ${r.label}" — ${r.label}은 ${numberOf(r.label)}번입니다`);
});

check("README의 「N 이름」이 실제 번호와 맞는다", () => {
  const refs = [...readme.matchAll(/`(\d+) ([A-Za-z]+)`/g)]
    .map((m) => ({ n: +m[1], label: m[2], line: lineAt(readme, m.index) }))
    .filter((r) => numberOf(r.label) > 0);
  const wrong = refs.filter((r) => r.n !== numberOf(r.label));
  return !wrong.length || wrong.map((r) => `README.md:${r.line} "\`${r.n} ${r.label}\`" — ${r.label}은 ${numberOf(r.label)}번입니다`);
});

// ─────────────────────────────────────────────────────────────
// 2. 버튼 라벨 — 라벨을 바꾸면 함께 고쳐야 하는 곳들 (CLAUDE.md 1절 3번)
// ─────────────────────────────────────────────────────────────
g("버튼 라벨");

check("설명·거절 문구가 부르는 버튼 이름이 실제로 있다", () => {
  // <b>add</b>처럼 굵게 부르는 이름만 본다. <b><code>push</code>…처럼 감싼 것은
  // 버튼이 아니라 명령어 얘기라 걸리지 않는다 (안쪽에 태그가 있으면 안 잡힌다)
  const called = [...html.matchAll(/<b>([^<>]{1,12})<\/b>/g)]
    .map((m) => ({ name: m[1], line: lineAt(html, m.index) }))
    .filter((c) => isCmdLabel(c.name) || /^PR\([^)]+\)$/.test(c.name));
  const stale = called.filter((c) => !labels.includes(c.name));
  const seen = new Set();
  return !stale.length || stale.filter((c) => !seen.has(c.name) && seen.add(c.name))
    .map((c) => `index.html:${c.line} <b>${c.name}</b> — 그런 라벨의 버튼이 없습니다`);
});

check("git 명령 버튼의 라벨과 title 속 명령이 일치한다", () => {
  const wrong = buttons
    .filter((b) => isCmdLabel(b.label))
    .filter((b) => !b.title.includes(`(git ${b.label}`));
  return !wrong.length || wrong.map((b) => `${b.id} "${b.label}" — title이 "(git ${b.label}…"으로 시작하지 않습니다: ${b.title || "(title 없음)"}`);
});

check("git 명령이 아닌 버튼은 한글 라벨이다", () => {
  // 한글 라벨 자체가 "이건 git 명령이 아니다"라는 신호다. 반대로 한글 버튼이
  // title에 git 명령을 달고 있으면 둘 중 하나가 잘못된 것이다
  const wrong = buttons.filter((b) => /[가-힣]/.test(b.label) && /\(git /.test(b.title));
  return !wrong.length || wrong.map((b) => `${b.id} "${b.label}" — 한글 라벨인데 title에 git 명령이 있습니다: ${b.title}`);
});

check("PR은 (열기)·(병합) 두 버튼으로 나뉘어 있다", () => {
  const pr = labels.filter((l) => l.startsWith("PR"));
  return setEq(pr, ["PR(열기)", "PR(병합)"]) ||
    [`지금: ${pr.join(", ") || "없음"}`, "한쪽만 이름을 바꾸면 \"PR = 합치는 것\"으로 읽힙니다 (CLAUDE.md 1절 3번)"];
});

// ─────────────────────────────────────────────────────────────
// 3. 하드 제약 — 어기면 산출물이 못 쓰게 되는 것들
// ─────────────────────────────────────────────────────────────
g("하드 제약");

check("localStorage / sessionStorage를 쓰지 않는다", () => {
  const hits = [...html.matchAll(/\b(localStorage|sessionStorage)\b/g)]
    .filter((m) => !inComment(html, m.index))
    .map((m) => `index.html:${lineAt(html, m.index)} ${m[1]}`);
  return !hits.length || [...hits, "실습실 공용 PC에 앞 사람 상태가 남습니다. 이어보기는 URL 해시(#step=13)로"];
});

check("첫 줄이 <!DOCTYPE html>이다", () =>
  html.startsWith("<!DOCTYPE html>") ||
  "없으면 quirks mode로 떨어져 window scroll 이벤트가 안 잡힙니다 (안내 스포트라이트가 멈춥니다)");

check("외부 자원은 Pretendard 웹폰트 하나뿐이다", () => {
  const ext = [...html.matchAll(/<(?:script|link)[^>]*(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  const bad = ext.filter((u) => !u.includes("pretendard"));
  return !bad.length || bad.map((u) => `단일 HTML 파일 제약을 깹니다: ${u}`);
});

check(".zone[hidden]{display:none}이 남아 있다", () =>
  /\.zone\[hidden\]\s*\{\s*display:\s*none\s*\}/.test(html) ||
  "이 한 줄이 없으면 숨겨야 할 구역 기둥이 직전 크기 그대로 잘린 채 남습니다");

check("ResizeObserver가 .legend와 #flowBar를 관찰한다", () => {
  const m = html.match(/new ResizeObserver\(placeZones\)[\s\S]{0,200}?\[([^\]]*)\]/);
  if (!m) return "ResizeObserver 설정을 못 찾았습니다";
  const missing = [".legend", "#flowBar"].filter((s) => !m[1].includes(s));
  return !missing.length || `${missing.join(", ")}이(가) 빠졌습니다 — 노선도 위에 얹히는 것은 여기 넣어야 구역 머리글이 옛 자리에 안 남습니다`;
});

check("범례 아이콘이 기호 규칙을 따른다 (버려진 커밋=점 / 안 받은 역=파선)", () => {
  const style = (cls) => html.match(new RegExp(`\\.lg i\\.${cls}\\{([^}]*)\\}`))?.[1] ?? "";
  const want = { ghost: "dotted", unfetched: "dashed" };
  const wrong = Object.entries(want).filter(([c, v]) => !style(c).includes(`border-style:${v}`));
  return !wrong.length || wrong.map(([c, v]) => `.lg i.${c}는 ${v}여야 합니다 — 그림과 범례가 어긋납니다 (CLAUDE.md 8절)`);
});

// ─────────────────────────────────────────────────────────────
// 4. 문서 동기화 — CLAUDE.md가 코드를 정확히 적고 있는가
// ─────────────────────────────────────────────────────────────
g("문서 동기화");

check("CLAUDE.md 좌표 상수표가 실제 값과 같다", () => {
  const rows = [...claude.matchAll(/^\| `(\w+)` \| (\d+) \|/gm)].map(([, name, v]) => ({ name, doc: +v }));
  if (!rows.length) return "CLAUDE.md 4절 상수표를 못 찾았습니다";
  const wrong = rows
    .map((r) => ({ ...r, code: num(r.name) }))
    .filter((r) => r.code !== null && r.code !== r.doc);
  return !wrong.length || wrong.map((r) => `${r.name}: 문서 ${r.doc} ↔ 코드 ${r.code}`);
});

check("CLAUDE.md가 적은 index.html 줄 수가 실제와 맞는다", () => {
  const m = claude.match(/약 ([\d,]+)줄/);
  if (!m) return true;
  const doc = +m[1].replace(/,/g, ""), real = html.replace(/\n$/, "").split("\n").length;
  const off = Math.abs(real - doc) / real;
  return off <= 0.05 ||
    `문서 "약 ${m[1]}줄" ↔ 실제 ${real.toLocaleString()}줄 (${Math.round(off * 100)}% 차이)`;
});

// ─────────────────────────────────────────────────────────────
// 보고
// ─────────────────────────────────────────────────────────────
let last = "";
for (const r of results) {
  if (r.group !== last) { console.log(`\n${(last = r.group)}`); }
  console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}`);
  for (const d of r.detail ?? []) console.log(`      ${d}`);
}

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length
    ? `\n${results.length}개 중 ${failed.length}개가 어긋났습니다.\n`
    : `\n${results.length}개 모두 통과했습니다.\n`
);
process.exit(failed.length ? 1 : 0);
