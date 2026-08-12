#!/usr/bin/env node
// 노선도 스냅샷 — 리팩터가 그림을 바꾸지 않았는지 보는 도구.
//
// 시나리오 일곱 편의 모든 단계와 자유 모드 조작열을 돌며, 매 상태에서 그려진 SVG와
// 사이드 UI를 받아 적는다. 코드를 고치기 전후로 한 번씩 떠서 diff가 0이면
// "보이는 것은 하나도 안 바뀌었다"가 증명된다.
//
//   node tools/snapshot.mjs before.json          # 뜨기
//   node tools/snapshot.mjs --diff a.json b.json # 견주기 (다르면 1로 끝난다)
//
// 브라우저는 Playwright의 Chromium을 쓴다. 처음이라면 `npx playwright install chromium`.
// 이미 어딘가에 받아 둔 것이 있으면 PW_CHROMIUM에 실행 파일 경로를 넣어 준다.
//
// 결정성이 생명이라 세 가지를 고정한다.
//   · 웹폰트를 막는다 — Pretendard가 뜬 판과 안 뜬 판은 textW()가 달라 좌표가 통째로 밀린다
//   · 애니메이션 흔적(class·style)을 지운다 — 잡은 순간에 따라 값이 흔들린다.
//     자리는 SVG transform '속성'에 최종값으로 들어 있으므로 비교에는 지장이 없다
//   · Math.random을 씨앗 있는 것으로 바꾼다 — 커밋 해시가 매번 달라 75/78이 어긋났다.
//     해시를 가려 버리면 "해시가 바뀐다"를 가르치는 Rebase 설명문을 못 보게 되므로,
//     지우는 대신 매번 같은 값이 나오게 한다

import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const HTML = new URL("../index.html", import.meta.url).href;

// ── 견주기 ────────────────────────────────────────────────
if (process.argv[2] === "--diff") {
  const [a, b] = process.argv.slice(3).map((f) => JSON.parse(readFileSync(f, "utf8")));
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const diff = keys.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  for (const k of diff) {
    console.log(`\n✗ ${k}`);
    const [x, y] = [a[k], b[k]];
    if (!x) { console.log("    앞쪽에 없는 상태입니다"); continue; }
    if (!y) { console.log("    뒤쪽에 없는 상태입니다"); continue; }
    for (const f of new Set([...Object.keys(x), ...Object.keys(y)]))
      if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) {
        console.log(`    ${f}`);
        console.log(`      전: ${String(x[f]).slice(0, 300)}`);
        console.log(`      후: ${String(y[f]).slice(0, 300)}`);
      }
  }
  console.log(diff.length ? `\n${keys.length}개 중 ${diff.length}개가 달라졌습니다.\n`
                          : `\n${keys.length}개 상태가 모두 같습니다.\n`);
  process.exit(diff.length ? 1 : 0);
}

// ── 돌아볼 상태 ───────────────────────────────────────────
const SCENARIOS = ["commit", "merge", "conflict", "push", "pr", "clone", "rebase"];

// 자유 모드에서 직접 쳐 볼 명령. 거절 경로(담지 않고 커밋)와 원격 왕복을 함께 지난다
const FREE = [
  `cmdCommit("담지 않고 커밋")`,          // 거절당한다 — 빨간 줄이 나와야 한다
  `cmdCommit("기능 시작", true)`,
  `cmdBranch("feature")`,
  `cmdCommit("기능 A", true)`,
  `cmdCommit("기능 B", true)`,
  `cmdSwitch("main")`,
  `cmdCommit("메인 수정", true)`,
  `cmdMerge("feature")`,
  `cmdPush()`,
  `cmdTeamCommit("팀원 커밋")`,
  `cmdBranchList()`,
  `cmdFetch()`,
  `cmdPull()`,
  `cmdSwitch("feature")`,
  `cmdPush()`,
  `cmdPROpen("feature")`,
  `cmdPR("feature")`,
  `cmdUndo()`,
];

// ── 페이지 안에서 도는 채집기 ─────────────────────────────
// 애니메이션 흔적만 걷어내고 그려진 것을 문자열로 만든다
const GRAB = `(() => {
  const svg = document.getElementById("canvas").cloneNode(true);
  svg.querySelectorAll("*").forEach(n => {
    n.removeAttribute("style");                    // rAF가 넣는 이동·등장 연출
    const c = (n.getAttribute("class") || "")
      .split(/\\s+/).filter(x => x && !/^(enter|edge-enter|edge-fade|node-move)$/.test(x));
    c.length ? n.setAttribute("class", c.join(" ")) : n.removeAttribute("class");
  });
  const sel = id => [...document.getElementById(id).options]
    .map(o => (o.disabled ? "-" : "") + o.value).join("|");
  const zone = id => {
    const e = document.getElementById(id);
    return e.hidden ? "hidden" : \`\${e.textContent}@\${e.style.top}+\${e.style.height}\`;
  };
  // 노선도 가로 스크롤. render()가 마지막에 잡는 값이라 실행 순서가 바뀌면 여기서 드러난다
  const ms = document.querySelector(".map-scroll");
  return {
    scroll: \`\${Math.round(ms.scrollLeft)}/\${ms.scrollWidth}/\${ms.clientWidth}\`,
    svg: svg.outerHTML,
    now: document.getElementById("nowBranch").textContent,
    staged: document.getElementById("stagedBox").hidden ? "" : document.getElementById("stagedTxt").textContent,
    cfx: document.getElementById("cfxBox").hidden ? "" : document.getElementById("cfxStep").innerHTML,
    sels: [sel("selSwitch"), sel("selMerge"), sel("selRebase"), sel("selPR")].join(" / "),
    log: document.getElementById("log").innerHTML,
    cmd: document.getElementById("curCmd").className + " :: " + document.getElementById("curCmd").textContent,
    note: document.getElementById("note").innerHTML,
    zoneLocal: zone("zoneLocal"),
    zoneRemote: zone("zoneRemote"),
    bodyClass: document.body.className,
  };
})()`;

// ── 뜨기 ─────────────────────────────────────────────────
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

// 페이지에서 터진 것은 즉시 크게 알린다. 그리기가 예외로 멈추면 SVG가 옛 상태로 남아
// "조금 달라졌네"처럼 보이는데, 실제로는 코드가 죽은 것이라 원인을 한참 헤매게 된다
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.split("\n")[0]));

// 웹폰트를 막아 글자 폭을 고정한다. 이걸 안 막으면 실행마다 좌표가 흔들린다
await page.route("**/*", (r) => (/^https?:/.test(r.request().url()) ? r.abort() : r.continue()));
// 커밋 해시를 고정한다. 페이지 스크립트보다 먼저 심어야 첫 커밋부터 걸린다 (mulberry32)
await page.addInitScript(() => {
  let s = 0x9e3779b9;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
});
await page.goto(HTML);
await page.waitForFunction("typeof render === 'function'");

const shots = {};
const grab = async (key) => {
  await page.waitForTimeout(60);          // 그리기가 끝나기를 기다린다
  shots[key] = await page.evaluate(GRAB);
};

for (const m of SCENARIOS) {
  await page.evaluate((k) => setMode(k), m);
  await grab(`${m}/0`);
  for (let i = 1; ; i++) {
    const more = await page.evaluate(() => {
      const b = document.getElementById("btnNext");
      if (b.disabled) return false;
      b.onclick();
      return true;
    });
    if (!more) break;
    await grab(`${m}/${i}`);
    if (i > 20) throw new Error(`${m}: 단계가 20을 넘습니다 — 무한 루프인지 보세요`);
  }
}

await page.evaluate(() => setMode("free"));
await grab("free/0");
for (const [i, cmd] of FREE.entries()) {
  await page.evaluate((c) => eval(c), cmd);
  await grab(`free/${i + 1} ${cmd}`);
}

await browser.close();

if (errors.length) {
  console.error(`\n페이지에서 오류가 났습니다 (${errors.length}건). 스냅샷을 믿을 수 없습니다:`);
  for (const e of [...new Set(errors)]) console.error(`  ${e}`);
  process.exit(2);
}

const out = process.argv[2] ?? "snapshot.json";
writeFileSync(out, JSON.stringify(shots, null, 1));
console.log(`${Object.keys(shots).length}개 상태를 ${out}에 적었습니다.`);
