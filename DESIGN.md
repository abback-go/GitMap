---
name: GitMap
description: Git 브랜치를 서울 지하철 노선도로 가르치는 단일 HTML 교육 웹앱
colors:
  seoul-line-1-blue: "#0052A4"
  seoul-line-3-orange: "#EF7C1C"
  seoul-line-2-green: "#00A84D"
  seoul-line-5-purple: "#996CAC"
  seoul-line-4-sky: "#00A5DE"
  earth-brown: "#B5651D"
  head-pink: "#E6186C"
  ink: "#141C26"
  ink-soft: "#5B6876"
  fog-paper: "#EDF0F5"
  card-white: "#FFFFFF"
  rule-line: "#D3DAE3"
  ghost-gray: "#AEB8C4"
  reject-red: "#B02A37"
  reject-bg: "#FCEBEC"
  staged-green: "#4A7A38"
  staged-bg: "#F3F8F0"
  note-plum: "#7A1038"
  note-bg: "#FFF4F8"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, Malgun Gothic, system-ui, sans-serif"
    fontSize: "37px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, Malgun Gothic, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, Malgun Gothic, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Pretendard Variable, Pretendard, Malgun Gothic, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 800
    letterSpacing: "0.14em"
  map-label:
    fontFamily: "Pretendard Variable, Pretendard, Malgun Gothic, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  command:
    fontFamily: "ui-monospace, SFMono-Regular, Cascadia Mono, Consolas, D2Coding, monospace"
    fontSize: "18.5px"
    fontWeight: 800
  log:
    fontFamily: "ui-monospace, SFMono-Regular, Cascadia Mono, Consolas, D2Coding, monospace"
    fontSize: "14.5px"
    lineHeight: 1.7
rounded:
  code: "4px"
  control: "8px"
  box: "9px"
  flow: "11px"
  panel: "14px"
  bubble: "16px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "16px"
  xl: "18px"
  gutter: "24px"
components:
  button-command:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  mode-pill:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  mode-pill-selected:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
  input-text:
    backgroundColor: "{colors.fog-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  tour-cta:
    backgroundColor: "{colors.head-pink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  cmdbar:
    backgroundColor: "{colors.fog-paper}"
    textColor: "{colors.ink}"
    typography: "{typography.command}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: GitMap

## Overview

**Creative North Star: "서울 지하철 노선도"**

이 시스템은 은유를 장식으로 쓰지 않고 데이터 인코딩으로 쓴다. 커밋은 역, 브랜치는 노선, 병합 커밋은 환승역이고, 노선 색 여섯은 실제 서울 지하철 노선색(1호선 파랑 #0052A4, 2호선 초록 #00A84D, 3호선 주황 #EF7C1C…)이다. 화면의 모든 시각 결정 — 알약형 이름표, 원형 역, 굵은 실선 선로, 밝은 노선 위 검은 글씨 — 은 실제 노선도 인쇄물의 관행을 따른다. 배경은 안개 낀 종이색(#EDF0F5) 위에 흰 카드 패널, 본문은 잉크색(#141C26) — 노선도가 걸린 역무실 안내판의 톤이다.

두 번째 축은 터미널이다. 이 앱의 성공 기준이 "로그를 실제 Git Bash에 옮겨 치기"이므로, 명령에 해당하는 모든 것은 모노스페이스 + `$` 접두 + 진한 굵기로 그려 진짜 터미널을 닮는다. 노선도(은유)와 터미널(실전)이 한 화면에서 짝지어지는 것이 이 시스템의 정체성이다.

**Key Characteristics:**
- 노선 색 = 실제 서울 지하철 노선색. 은유의 핵심이라 불변
- HEAD 분홍(#E6186C, 8호선 계열)이 유일한 브랜드 악센트 — "지금 여기"만 가리킨다
- 상태 구분은 색 + 선 종류를 항상 함께 (점선 = 버려짐, 파선 = 아직 안 받음)
- 거절·오류는 숨기지 않고 배경까지 칠해 뒷자리에서도 읽히게
- 교수 시연이 주 장면: 16px 본문, 굵은 무게, 대비 기준 엄수

## Colors

서울 지하철 노선색 여섯이 데이터를 맡고, 분홍 하나가 "현재"를 맡고, 나머지는 잉크와 종이다.

### Primary
- **HEAD 분홍** (#E6186C): "지금 여기" 전용. HEAD 뱃지, `$` 프롬프트 접두, focus ring, 자동 안내 CTA·스포트라이트 테두리·진행 막대. 상태 표시 외 장식으로 쓰지 않는다.

### Secondary — 노선색 (데이터 인코딩)
- **1호선 파랑** (#0052A4), **3호선 주황** (#EF7C1C), **2호선 초록** (#00A84D), **5호선 보라** (#996CAC), **4호선 하늘** (#00A5DE), **갈색** (#B5651D): 브랜치 lane 순서대로 순환 배정. 노선(선로)·역 테두리·브랜치 이름표 알약에 쓰인다.
- **원격 회색** (#5B6876): 서버에만 있는 것들의 색. 파선 역·파선 선로·속 빈 원격 이름표.
- **유령 회색** (#AEB8C4): rebase 후 버려진 커밋. 점선과 함께만 쓰인다.

### Neutral
- **잉크** (#141C26): 본문, 명령 버튼 배경, 선택된 알약 배경, 헤더 밑줄.
- **연한 잉크** (#5B6876): 보조 글자의 하한선. 이보다 흐린 회색은 본문에 금지.
- **안개 종이** (#EDF0F5): 페이지 배경, 입력칸·로그·명령 띠 배경.
- **카드 흰색** (#FFFFFF): 패널 배경.
- **괘선** (#D3DAE3): 테두리, 구분선, 번호 알약 배경.

### 상태색
- **거절 빨강** (#B02A37) + **거절 배경** (#FCEBEC): 거절된 명령·CONFLICT 줄·충돌 상자. 거절은 교재이므로 배경까지 칠한다.
- **담김 초록** (#4A7A38) + **담김 배경** (#F3F8F0): 스테이징 상자. 초록 파선 테두리.
- **설명 자두** (#7A1038) + **설명 배경** (#FFF4F8): 현재 단계 설명 상자.

### Named Rules
**The Line-Color Rule.** 노선색 여섯은 서울 지하철 실물이다. 추가는 되어도 교체는 안 된다. 알약 글씨색은 고정값이 아니라 `pillText()` 대비 계산으로 검정/흰색을 고른다 — 실제 노선도도 밝은 노선엔 검은 글씨를 쓴다.

**The One-Pink Rule.** #E6186C은 "현재 위치·주목"만 뜻한다. HEAD, `$`, focus, 안내 스포트라이트 외에 쓰면 의미가 무너진다.

**The Contrast-Floor Rule.** 본문 글자는 #5B6876(대비 4.99+)까지만 흐려진다. #8A96A4·#9AA5B1은 기준(4.5) 미달로 퇴출된 전력이 있다.

## Typography

**Display/Body Font:** Pretendard Variable (Malgun Gothic, system-ui 폴백 — 오프라인 수업 대비)
**Command Font:** ui-monospace 스택 (SFMono-Regular, Cascadia Mono, Consolas, D2Coding)

**Character:** 한국어 교육 자료의 또렷한 고딕 + 진짜 터미널의 모노스페이스. 굵기 대비(800 vs 400~600)가 위계를 만들고, 크기는 시연용으로 전반적으로 큰 편.

### Hierarchy
- **Display** (800, 37px, 1.1, -0.03em): 페이지 제목 h1 하나뿐.
- **Headline** (800, 21px, -0.02em): 안내 말풍선 제목.
- **Body** (400, 16px, 1.55): 설명·버튼·입력. 안내 말풍선 본문은 17px.
- **Label** (800, 13.5px, +0.14em, uppercase): 패널 머리글 (명령 · 원격 저장소 등).
- **Map Label** (600~700, 14px): 노선도 안 역 메시지·이름표. 해시는 13.5px. **폭 실측 문자열 `LBL_FONT`도 14px로 함께 묶여 있다.**
- **Command** (800, 18.5px, mono): 방금 실행한 명령 띠, 현재 위치 값.
- **Log** (400~700, 14.5px, 1.7, mono): 실행한 명령 로그.

### Named Rules
**The Terminal-Truth Rule.** 모노스페이스와 `$` 접두는 "실제 터미널에 옮겨 칠 수 있는 문자열"에만 붙는다. 팀원·GitHub이 한 일은 `#`, 명령의 출력은 접두 없음. 이 구분이 곧 커리큘럼이다.

**The Bundle Rule.** 글자 크기와 좌표 상수는 한 묶음이다. 14px를 바꾸면 알약 높이(24)·흰 바탕(32)·HEAD 뱃지(56×26)·`lblW` 여백(+24)·`LBL_FONT`가 함께 움직여야 한다.

## Layout

2열 그리드: 노선도+작업 패널(왼쪽 열, 두 행)과 조작판(오른쪽 380px, 두 행 걸침). `.wrap` 상한 1240px, 여백 24px 20px 48px, 패널 사이 18px.

- **1400px 이상**: `.wrap` 1560px, 조작판 560px로 넓혀 명령·원격 두 묶음을 나란히. 상한을 같이 안 올리면 Rebase 그래프(781px)가 가로 스크롤을 만든다.
- **900px 이하**: 한 열로 접힘. 명령 띠는 32px 축약형으로 유지 — 거절의 빨간 신호가 폰에서도 보여야 한다.
- **560px 이하**: 시나리오 묶음 라벨이 자기 줄로 올라가고 번호 알약 배경 제거.
- 검증 기준 폭은 데스크톱 1440px과 모바일 390px.

노선도 내부는 SVG 좌표계: 가로 칸 132px(COL_W), 세로줄 122px(ROW_H0, 이름표가 쌓이면 동적 확장), 이름표 간격 28px. 구역 머리글만 SVG 밖 HTML 오버레이(가로 스크롤 비추종).

**The Zone Rule.** 위 구역 = 내 컴퓨터, 아래 회색 띠 = 팀 공용 서버. 역이 어느 구역에 있는가가 곧 의미이므로, 레이아웃 변경이 이 경계를 흐리면 안 된다.

## Elevation & Depth

현재 구현은 테두리선 위주다: 패널에만 은은한 이중 그림자(`0 1px 2px rgba(20,28,38,.06), 0 8px 24px rgba(20,28,38,.07)`), 안내 말풍선에 무거운 부양 그림자(`0 18px 50px rgba(0,0,0,.32)`), 나머지 위계는 1.5px 괘선과 배경색 차이로 만든다.

**확정 방향(사용자 결정): 그림자를 더 적극적으로 쓸 수 있다.** 향후 작업에서 층위(패널 위 요소, 떠 있는 UI)를 그림자로 표현하는 것이 허용된다. 단 노선도 SVG 내부(역·선로)는 인쇄물 은유대로 평평하게 유지.

### Shadow Vocabulary
- **panel-ambient** (`0 1px 2px rgba(20,28,38,.06), 0 8px 24px rgba(20,28,38,.07)`): 카드 패널 기본.
- **tip-float** (`0 18px 50px rgba(0,0,0,.32)`): 화면에 떠 있는 안내 말풍선.
- **spotlight-ring** (`0 0 0 3px #E6186C`): 그림자가 아니라 강조 테두리 — 안내가 밝힌 자리.

## Shapes

원과 알약의 시스템이다. 역은 원(17px, 테두리 3px), 브랜치 이름표·모드 버튼·HEAD 뱃지·안내 CTA는 알약(radius 999px) — 지하철 사이니지의 노선 뱃지 형태. 패널은 14px, 조작 요소는 8px, 말풍선은 16px 라운드.

선 종류가 의미를 진다: **실선** = 살아있는 것, **파선(7 5)** = 서버에 있지만 아직 안 받은 것, **점선(0.1 5 round-cap)** = rebase로 버려진 것. **파선 테두리**는 HTML 쪽에서도 "잠정 상태"를 뜻한다(스테이징 상자, 흐름 띠의 아직 안 간 칸, 범례 구분선).

**The Symbol-Pair Rule.** 상태 구분은 색과 선 종류를 항상 함께 바꾼다. 색 하나로만 구분하면 학생이 못 알아본다. 범례 아이콘도 같은 규칙을 따라야 한다.

## Components

성격: **지하철 사이니지** — 굵고, 대비 크고, 한눈에 읽히는. 명령 버튼은 잉크 단색으로 터미널처럼 단단하고, 조회·보조 버튼은 ghost로 물러선다.

### Buttons
- **Shape:** 8px 라운드 (모드 선택·안내 CTA만 알약 999px)
- **Command (`.act`)**: 잉크 배경(#141C26) + 흰 글씨, 700, 16px, 9px 13px. git 명령 대응 버튼은 라벨이 명령어 원문.
- **Ghost (`.act.ghost`)**: 투명 배경 + 잉크 글씨 + 괘선 테두리. 팀원 시뮬레이션·조회 명령.
- **Hover / Active:** 명령은 opacity .85, ghost는 테두리가 잉크로. active는 1px 내려앉음. disabled는 opacity .32.
- **Focus:** 2.5px HEAD 분홍 outline, offset 1px — 모든 입력·버튼 공통.

### 모드 알약 (`.modes button`)
- 흰 배경 + 연잉크 글씨 + 괘선, 알약형. 선택되면 잉크 배경 + 흰 글씨. 시나리오 묶음은 알약 컨테이너 안에 번호 뱃지(`i`, 12px 800, 괘선 배경)와 함께.

### Inputs
- 안개 종이 배경 + 1.5px 괘선, 8px 라운드, 16px 글씨, 9px 11px 패딩.

### 명령 띠 (`.cmdbar`) — 시그니처
- 방금 실행한 명령 한 줄. 높이 44px 고정(비어도 예약), mono 18.5px 800, `$` 접두는 HEAD 분홍. 거절이면 글씨 빨강 + 배경 #FCEBEC — 뒷자리에서 "막혔다"가 즉시 읽힌다.

### 상태 상자
- **담긴 변경 (`.staged`)**: 초록 파선 테두리 + 연초록 배경 — "아직 커밋 전" 잠정 상태.
- **충돌 (`.cfx`)**: 빨강 실선 테두리 + 연빨강 배경 — "멈춰 있다". 고른 쪽 버튼은 눌린 채(#B02A37 배경) 남는다.
- **설명 (`.note`)**: 분홍 계열 배경 + 자두색 글씨. 현재 단계 안내.

### 노선도 이름표 + HEAD 뱃지 — 시그니처
- 브랜치 이름표: 노선색 채운 알약(높이 24), 글씨색은 `pillText()` 계산. 현재 브랜치 이름표 오른쪽에 HEAD 분홍 알약 뱃지(56×26). 원격 이름표는 속 빈 알약(흰 배경 + 회색 테두리) — 채움/빈 것이 로컬/원격 구분.

### 자동 안내 (spotlight + 말풍선)
- 어두운 막(rgba(12,18,26,.6))에 clip-path로 구멍을 뚫어 대상을 밝힌다(두 곳 동시 가능). 말풍선은 흰 16px 라운드 + tip-float 그림자, 진행 막대는 단계당 한 칸. 스포트라이트 이동은 `.35s cubic-bezier(.4,0,.2,1)`.

### 노선도 모션
- **등장 pop**: `.34s cubic-bezier(.34,1.56,.64,1)` — 새 역이 튀어나오는 overshoot.
- **선로 draw**: stroke-dashoffset `.4s ease-out` — 선로가 그려진다.
- **역 이동**: `.5s cubic-bezier(.32,.72,.28,1)` — fetch/pull로 받은 역이 서버 구역에서 올라온다. translate는 바깥 `g`, scale은 안쪽 `gi` — 분리 필수.
- 일반 상태 전환은 `.15s`. `prefers-reduced-motion`이면 전부 끈다.

## Do's and Don'ts

### Do:
- **Do** 알약 글씨색을 `pillText(color)`로 계산한다. `COLORS`에 색을 추가해도 자동으로 걸린다.
- **Do** 상태를 색 + 선 종류로 함께 구분하고, 범례 아이콘을 같은 규칙으로 맞춘다.
- **Do** 이름표 폭을 `textW()`로 실측한다. Pretendard는 고정폭이 아니라 글자 수 어림은 한글 10자부터 넘친다.
- **Do** 거절·오류를 배경색까지 칠해 원거리에서 읽히게 한다.
- **Do** 글자 크기를 바꿀 때 좌표 상수 묶음(알약 24 · 흰 바탕 32 · HEAD 뱃지 56×26 · `LBL_FONT`)을 함께 움직인다.

### Don't:
- **Don't** 노선색 팔레트·지하철 은유·Pretendard를 교체하지 않는다 (브랜드 불변).
- **Don't** #8A96A4·#9AA5B1 등 대비 4.5 미만 회색을 본문에 쓰지 않는다. 흐림의 하한은 #5B6876.
- **Don't** HEAD 분홍을 상태 표시 밖 장식에 쓰지 않는다.
- **Don't** 노선도 SVG 내부에 그림자·입체 효과를 넣지 않는다 — 인쇄물 은유대로 평평하게.
- **Don't** `1fr` 그리드 트랙에 nowrap 버튼을 그대로 두지 않는다. `minmax(0,1fr)`로 못박는다.
