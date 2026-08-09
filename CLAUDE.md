# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

Git 브랜치 개념을 지하철 노선도 은유로 시각화한 교육용 단일 HTML 웹앱.
명지전문대 AI게임학과 강의 자료.

- 저장소: https://github.com/abback-go/GitMap
- 배포: https://abback-go.github.io/GitMap/ (GitHub Pages, `main` 브랜치)
- 본체: `index.html` 한 파일 (약 960줄)

---

## 1. 지켜야 할 제약

작업할 때 항상 유효한 규칙이다. 어기면 산출물이 못 쓰게 된다.

1. **단일 HTML 파일 구조 유지.** 외부 JS/CSS로 분리하지 않는다 (Claude 아티팩트 이식을 염두에 둔 구조)
2. **`localStorage` / `sessionStorage` 사용 금지**
3. **한국어 UI 유지**
4. **디자인 방향을 바꾸지 않는다** — 지하철 노선도 은유, 색 팔레트, Pretendard 폰트
5. **산출물은 작업 폴더에만 기록한다.** 바탕화면 등 폴더 밖 경로는 요청 없이 건드리지 않는다
6. 코드 수정 후에는 **반드시 브라우저로 렌더링 → 스크린샷 → 눈으로 확인**. 스크린샷 없이 "수정했습니다"라고 보고하지 않는다
7. 데스크톱(1440px)과 모바일(390px) **두 폭 모두** 확인

## 2. 검증 방법

브라우저 MCP는 세션마다 다르다. **먼저 붙어 있는 도구를 확인하고 그에 맞춰 진행한다.**

| 도구 | 페이지 열기 | JS 실행 |
|---|---|---|
| Playwright MCP (`mcp__playwright__*`) | `browser_navigate` | `browser_evaluate` |
| Chrome MCP (`mcp__claude-in-chrome__*`) | `tabs_create_mcp` / `navigate` | `javascript_tool` |

Chrome MCP는 `claude-in-chrome` 스킬을 먼저 호출하고, 도구가 지연 로딩 상태면 `ToolSearch`로 필요한 것을 **한 번에** 받아온다.

`file://`은 브라우저 MCP가 차단하므로 로컬 정적 서버를 띄운다.

```bash
python -m http.server 8765 --bind 127.0.0.1   # run_in_background: true
# http://127.0.0.1:8765/index.html
```

- 스크린샷 저장 경로는 작업 폴더 안이어야 한다 (`shots/`). 폴더 밖은 거부된다
- `shots/`, `.playwright-mcp/`는 `.gitignore`로 제외되어 있다. 스크린샷은 저장소에 넣지 않는다
- 상태 조작은 UI 클릭보다 **전역 함수 직접 호출**이 빠르다 (아래 3절 표)
- **주의**: 헤드리스 환경에서 CSS transition / rAF가 지연되어 `getBoundingClientRect()`가 애니메이션 중간값을 돌려줄 때가 있다. 위치를 정밀 측정할 때는 인라인 스타일 값(`tip.style.top`)을 읽어야 신뢰할 수 있다

## 3. 코드 구조

### 상태 (`S`)

```js
S = {
  commits: { [id]: { id, parents:[], lane, msg, color, merge?, from? } },
  order:   [id, ...],        // 생성 순서 = 위상 정렬 순서
  branches:{ [name]: { name, head, lane, color, remote? } },
  head:    "main",           // 현재 브랜치 이름 (원격은 절대 들어가지 않음)
  laneNext: 0,
  log:     [{ t, k }]        // k: 없으면 명령, "e" 거절/오류, "n" 명령 아닌 설명
}
```

- `undoStack`은 `clone(S)`의 배열 (최대 60)
- `seenNodes` / `seenEdges`는 등장 애니메이션 1회 재생용 추적 집합
- 원격은 `S.branches["origin/main"]`에 `remote:true`로 들어간다. 브랜치 구조를 재사용하므로 이름표 렌더·도달성 계산이 그대로 동작한다

### 조작 API (전부 전역)

브라우저에서 JS로 직접 호출해 상태를 만든다. UI 클릭보다 빠르고 정확하다.

| 함수 | 동작 |
|---|---|
| `cmdCommit(msg)` | 현재 브랜치에 커밋. `msg` 비면 거절 |
| `cmdBranch(name)` / `cmdSwitch(name)` | 브랜치 생성(+이동) · 이동 |
| `cmdMerge(name)` / `cmdRebase(name)` | 병합 · 재배치 |
| `cmdTeamCommit(msg)` | 팀원이 원격에 커밋 (내 브랜치는 안 움직임) |
| `cmdPull()` / `cmdPush()` | 원격 동기화. main에서만 동작 |
| `cmdUndo()` | 한 단계 되돌리기 (`undoStack`) |
| `setMode(m)` | `"free"` / `"merge"` / `"rebase"`. 상태를 초기화한다 |
| `tourStart()` / `tourGo(i)` | 자동 안내 시작 · `i`번 단계로 (0-based, 21단계) |

- **거절 경로가 조용하다.** 가드에 걸리면 아무 반환값 없이 `#note`에만 문구를 쓴다 (`remoteGuard`, `cmdPush`의 non-fast-forward 등). 스크린샷 찍기 전에 `#note` 텍스트와 `S.log` 마지막 줄을 확인해야 "실행됐다고 착각한 상태"를 안 찍는다
- `setMode`는 `fresh(m === "free")`를 부르므로 **자유 모드에서만 원격(`origin/main`)이 생긴다**

### 렌더 파이프라인 (`render()`)

순서에 의존성이 있다. 중간에 끼워 넣을 때 주의.

1. `reach` — 모든 브랜치 head의 조상 집합. 여기 없으면 "버려진 커밋"
2. `depth` — 부모 최대 depth + 1 → 가로 칸 번호
3. `rowKey` / `rows` / `rowOf` — 세로줄 배치. `(살아있음? "L":"G") + lane`으로 묶고 **살아있는 줄 먼저, 그다음 버려진 줄** 순으로 정렬해 행 번호를 부여. 빈 lane은 자동 압축된다
4. `labels` — 커밋별 브랜치 이름표 묶음, `stackMax`, 동적 `ROW_H`
5. `gapAt` / `colX` — 이름표가 다음 칸 역을 덮지 않도록 열 간격 확대
6. `pos` — 최종 좌표, `maxX` / `maxY`
7. 줄 안내선 → 선로(edge) → 역(node) → 이름표+HEAD 순으로 그린다 (z-order가 이 순서에 의존)

### 좌표 규칙

| 상수 | 값 | 뜻 |
|---|---|---|
| `COL_W` | 112 | 기본 가로 칸 간격 |
| `ROW_H0` | 104 | 기본 세로줄 간격 (이름표가 쌓이면 늘어남) |
| `LBL_GAP` | 23 | 이름표 세로 간격 |
| `TOUR_DOCK` | 20 | 노선도 패널과 안내 말풍선 사이 고정 여백 |

- `ROW_H = max(104, (stackMax-1)*23 + 68)` — 쌓인 이름표가 아래 줄 글자와 겹치지 않게
- 커밋 원 위쪽에 **메시지 → 해시 → 원** 순으로 배치. 아래쪽은 비워 둔다
- 이름표는 원 오른쪽에 세로로 쌓이고, 현재 브랜치 이름표 오른쪽에 HEAD 뱃지가 붙는다

## 4. 알려진 함정 (반복 금지)

- **SVG `<g transform="translate()">`에 CSS `transform: scale()` 애니메이션을 직접 걸면 translate가 덮어써져 요소가 (0,0)으로 날아간다.** translate용 그룹과 scale 애니메이션용 그룹을 반드시 분리할 것 (`g` / `gi` 구조가 그 때문)
- `svg { min-width: 100% }`를 주면 viewBox 대비 늘어나며 요소가 잘린다
- 노드 위쪽에 텍스트, 아래쪽은 여백 — 이 배치를 유지. 위아래 여백 부족으로 원이 잘리지 않는지 매번 확인
- 사용자 입력(커밋 메시지, 브랜치 이름)을 `innerHTML`에 넣기 전 **반드시 `esc()`** 를 통과시킬 것
- Bash 도구에서 PowerShell here-string(`@'...'@`)은 동작하지 않는다. 여러 줄 커밋 메시지는 heredoc(`<<'EOF'`)을 쓸 것

---

## 5. 작업 이력

원본 3개 버그부터 원격 저장소 구현·저장소 구성까지 9차에 걸친 변경 내역은 `HISTORY.md`에 있다.
지금 지켜야 할 규칙은 위 1·4절에 다 옮겨 두었으므로, 이력은 "왜 이렇게 됐는지"를 물을 때만 열면 된다.

---

## 6. 브랜치 운영

| 브랜치 | 역할 |
|---|---|
| `main` | 배포본. GitHub Pages가 서빙한다. **머지 = 배포** |
| `develop` | 작업용 |

```bash
git switch develop
# 수정 & 커밋
git switch main
git merge develop
git push
```

두 브랜치는 **같은 파일 목록**을 유지한다. 브랜치별로 파일을 나누면 머지 때마다 충돌한다.

Pages는 브랜치 하나만 서빙하므로 develop의 변경은 배포에 반영되지 않는다. 작업 중 확인은 로컬 서버로.

## 7. 미결 / 판단 보류

- **원격 브랜치가 2개 이상이면 서버 띠에서 이름표가 잘리거나 겹친다.** `maxX`는 이름표 하나 기준(`px + w/2 + 14`)만 잡는데 렌더는 `i*(w+6)`만큼 옆으로 밀고, `gapAt`(열 간격) 계산에도 원격 이름표 폭이 들어가지 않는다. 지금은 `fresh()`가 `origin/main` 하나만 만들고 늘리는 경로가 없어 도달 불가능한 상태. 원격을 늘릴 때 같이 고칠 것
- **rebase가 여러 번 일어나면** 버려진 커밋들이 한 줄에 모여 칸이 겹칠 수 있다. 현재 구조는 버려진 줄을 원래 lane별로 구분하지만 서로 다른 rebase의 유령이 같은 칸에 오는 경우까지는 검증하지 않았다
- **파비콘 없음** — 배포 페이지에서 `favicon.ico` 404가 콘솔에 남는다. 동작에는 영향 없음
- 자동 안내 전체 재생은 약 2분 40초(23단계). 수업에서 길면 단계별 지속시간(`tourShow`의 `dur` 계산)을 줄이면 된다
