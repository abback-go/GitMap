// AGENTS.md는 CLAUDE.md와 같은 문서다. 읽는 쪽이 Codex냐 Claude Code냐만 다르다.
//
// 갈리는 자리를 여기 한 곳에 적어 두고, 만드는 쪽(--write)과 검사하는 쪽(check.mjs)이
// 같은 표를 쓴다. 따로 들고 있으면 한쪽만 고쳐 두 문서가 조용히 어긋난다.
//
//   node tools/agents-sync.mjs --write     CLAUDE.md로 AGENTS.md를 다시 만든다
//   node tools/agents-sync.mjs             어긋났는지만 본다 (통과 0 / 어긋나면 1)
//
// SUBS를 늘리기 전에 "정말 에이전트 전용인가"를 먼저 물을 것. 코드 규칙·좌표·함정은
// 읽는 쪽이 누구든 똑같으므로 여기 들어올 이유가 없다.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../CLAUDE.md", import.meta.url);
const DST = new URL("../AGENTS.md", import.meta.url);

// [CLAUDE.md 쪽, AGENTS.md 쪽]
export const SUBS = [
  ["# CLAUDE.md", "# AGENTS.md"],

  // 없는 주소를 만들지 않는다. 예전 AGENTS.md는 Claude→Codex 일괄 치환이라
  // "Codex.ai/code"라는 존재하지 않는 주소가 적혀 있었다
  [
    "This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.",
    "This file provides guidance to Codex and other coding agents working in this repository.\n" +
      "`CLAUDE.md`와 같은 내용이다 — 한쪽만 고치지 말 것 (`node tools/agents-sync.mjs --write`).",
  ],

  // 훅과 달리 문서는 "읽는 에이전트에게만" 걸린다는 뜻이라 특정 이름에 묶이지 않는다
  ["문서는 Claude 세션에만,", "문서는 에이전트 세션에만,"],

  // 아래 MCP 이름표는 Claude Code 전용이다. 그 사실을 밝히고 대안을 준다
  [
    "브라우저 MCP는 세션마다 다르다. **먼저 붙어 있는 도구를 확인하고 그에 맞춰 진행한다.**",
    "붙어 있는 브라우저 자동화 도구는 세션마다 다르다. **먼저 무엇이 있는지 확인하고 그에 맞춰 진행한다.**\n\n" +
      "아래 이름은 Claude Code 기준이다. 다른 에이전트는 이름이 다르거나 MCP 자체가 없을 수 있다.",
  ],
  [
    "받아온다.\n\n`file://`",
    "받아온다.\n\n" +
      "**MCP가 없으면 playwright를 직접 부른다.** `devDependencies`에 들어 있고 " +
      "`npx playwright install chromium`\n한 번이면 바이너리가 준비된다. " +
      "쓰는 법은 같은 방식으로 도는 `tools/snapshot.mjs`를 참고할 것.\n\n`file://`",
  ],
];

// Windows 체크아웃은 줄 끝이 CRLF다. 견줄 때는 LF로 맞추고, 쓸 때는 원본 형식을 따른다
const lf = (s) => s.replace(/\r\n/g, "\n");

/** CLAUDE.md 본문으로 AGENTS.md 본문을 만든다. 못 찾은 자리가 있으면 그 목록을 돌려준다 */
export function buildAgents(claudeText) {
  let out = lf(claudeText);
  const missing = [];
  for (const [from, to] of SUBS) {
    if (!out.includes(from)) { missing.push(from.slice(0, 48) + "…"); continue; }
    out = out.replace(from, to);
  }
  return { text: out, missing };
}

/** 두 본문이 SUBS만큼만 다른지 본다. 같으면 null, 다르면 사람이 읽을 설명 */
export function diffAgents(claudeText, agentsText) {
  const { text, missing } = buildAgents(claudeText);
  if (missing.length) return missing.map((m) => "CLAUDE.md에서 못 찾음: " + m);

  const want = text, got = lf(agentsText);
  if (want === got) return null;

  const a = want.split("\n"), b = got.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return [
        `${i + 1}번째 줄부터 다릅니다 — 한쪽만 고쳤습니다`,
        `CLAUDE.md 쪽: ${(a[i] ?? "(줄 없음)").slice(0, 60)}`,
        `AGENTS.md 쪽: ${(b[i] ?? "(줄 없음)").slice(0, 60)}`,
        `고치려면: node tools/agents-sync.mjs --write`,
      ];
    }
  }
  return [`길이가 다릅니다 — CLAUDE.md ${a.length}줄 / AGENTS.md ${b.length}줄`];
}

// 직접 실행했을 때만 파일을 건드린다 (check.mjs는 import만 한다)
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const claude = readFileSync(SRC, "utf8");
  const crlf = claude.includes("\r\n");

  if (process.argv.includes("--write")) {
    const { text, missing } = buildAgents(claude);
    if (missing.length) {
      console.error("CLAUDE.md에서 아래를 못 찾았습니다 — SUBS를 손봐야 합니다:");
      for (const m of missing) console.error("  " + m);
      process.exit(1);
    }
    writeFileSync(DST, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
    console.log(`AGENTS.md를 다시 썼습니다 (${text.split("\n").length}줄, ${crlf ? "CRLF" : "LF"})`);
    process.exit(0);
  }

  let agents;
  try { agents = readFileSync(DST, "utf8"); }
  catch { console.error("AGENTS.md가 없습니다 — node tools/agents-sync.mjs --write"); process.exit(1); }

  const d = diffAgents(claude, agents);
  if (!d) { console.log("AGENTS.md가 CLAUDE.md와 맞습니다."); process.exit(0); }
  for (const line of d) console.error(line);
  process.exit(1);
}
