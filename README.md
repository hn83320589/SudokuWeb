# Sudoku Web

以 Vue 3、TypeScript 和 Tailwind CSS v4 打造的網頁版數獨遊戲。

## 快速開始

### 環境需求

- Node.js >= 18
- npm >= 9

### 安裝

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

啟動本機開發伺服器（預設 `http://localhost:5173`）。

### 正式建置

```bash
npm run build
```

輸出至 `dist/` 目錄。建置流程會先執行 `vue-tsc` 型別檢查，再由 Vite 打包。

### 預覽正式版

```bash
npm run preview
```

## 技術堆疊

| 層級 | 技術 |
|---|---|
| 框架 | Vue 3.5（`<script setup>` SFC） |
| 語言 | TypeScript 5.9 |
| 打包工具 | Vite 7 |
| 樣式 | Tailwind CSS 4（Vite 外掛） |
| 多語系 | vue-i18n 10（Composition API 模式） |

不使用路由器或狀態管理套件，整個應用程式由 composables 驅動。

## 專案結構

```
src/
├── main.ts                     # 應用程式進入點（註冊 i18n 外掛）
├── App.vue                     # 根元件——串接所有邏輯與子元件
├── style.css                   # 全域樣式 / Tailwind 匯入
├── types/
│   └── sudoku.ts               # 共用型別：Cell、Board、Difficulty、DifficultyConfig
├── utils/
│   ├── rules.ts                # SudokuRules 介面 + classicRules 單例
│   ├── generator.ts            # 謎題產生（填充 + 唯一解驗證移除）
│   ├── solver.ts               # 回溯求解器 + 提示查詢
│   └── cookie.ts               # Cookie 讀寫工具（getCookie / setCookie）
├── i18n/
│   ├── index.ts                # vue-i18n 實例建立與語系載入
│   └── locales/
│       ├── en.json             # 英文翻譯
│       ├── zh-TW.json          # 繁體中文翻譯（預設語系）
│       └── ja.json             # 日文翻譯
├── composables/
│   ├── useSudoku.ts            # 棋盤狀態、格子操作、衝突偵測、完成偵測
│   ├── useGame.ts              # 遊戲回合：計時、暫停、步數、擦除、提示、難度
│   └── useRecords.ts           # 記憶體內遊戲紀錄
└── components/
    ├── SudokuBoard.vue         # 9×9 格線——選取、鍵盤導航、高亮邏輯
    ├── SudokuCell.vue          # 單一格子——顯示、樣式、宮格邊框
    ├── NumberPad.vue           # 1-9 輸入按鈕 + 鍵盤監聽
    ├── GameControls.vue        # 清除 / 提示 / 新遊戲按鈕
    ├── GameTimer.vue           # 分:秒 顯示
    ├── GameStatus.vue          # 步數 / 清除次數 / 提示次數
    ├── SettingsModal.vue       # 難度選擇（下局生效）
    ├── RecordsModal.vue        # 歷史遊戲紀錄（目前未掛載於 UI）
    └── FireworkCanvas.vue      # 勝利煙火 + 粒子文字動畫
```

## 架構設計

### 資料流

```
App.vue
  └─ useGame()            ← 擁有所有遊戲狀態
       └─ useSudoku()     ← 擁有棋盤 + 衝突偵測 + 完成偵測
            └─ generator   ← 產生謎題 / 解答格線
            └─ rules       ← 提供驗證 + 約束群組
```

`App.vue` 從 `useGame()` 解構所有狀態，透過 props 向下傳遞給子元件；子元件透過 `emit` 向上傳遞事件。沒有使用全域狀態管理。

### 規則抽象層（`src/utils/rules.ts`）

所有數獨約束邏輯集中在 `SudokuRules` 介面背後：

```typescript
interface SudokuRules {
  gridSize: number              // 9
  boxWidth: number              // 3
  boxHeight: number             // 3
  validNumbers: readonly number[]  // [1..9]
  totalCells: number            // 81

  isValid(grid, row, col, num): boolean
  getRelatedCells(row, col): [number, number][]
  getCompletionGroups(): { type, index, cells }[]
  getBoxIndex(row, col): number
  isBoxLeftEdge(col): boolean
  isBoxTopEdge(row): boolean
}
```

匯出的 `classicRules` 單例實作標準 9×9 數獨規則。所有檔案皆從此單一來源匯入，程式碼中不再散落魔術數字（`9`、`3`、`81`）。

**新增變體玩法**（例如對角線數獨）：建立新的 `SudokuRules` 實作，在 `getCompletionGroups()` 加入對角線約束群組，並在 `isValid()` 中檢查對角線即可。

### 難度設定（`src/types/sudoku.ts`）

每個難度等級由 `DifficultyConfig` 完整描述：

```typescript
interface DifficultyConfig {
  label: string        // 翻譯鍵（如 'difficulty.easy.label'）
  description: string  // 翻譯鍵（如 'difficulty.easy.desc'）
  clueCount: number    // 預填格數
  maxErases: number    // 每局擦除次數上限
  maxHints: number     // 每局提示次數上限
}
```

目前的數值：

| 難度 | 提示格數 | 擦除次數 | 提示次數 |
|---|---|---|---|
| Easy（簡單） | 38 | 8 | 5 |
| Normal（普通） | 30 | 5 | 3 |
| Hard（困難） | 24 | 3 | 1 |

若要調整遊戲平衡，修改 `src/types/sudoku.ts` 中的 `DIFFICULTY_CONFIGS` 常數即可。

> **注意**：`label` 和 `description` 欄位儲存的是 i18n 翻譯鍵（非文字），元件中透過 `$t(config.label)` 取得翻譯後的文字。

### 完成偵測

當格子數值改變時，`useSudoku.checkCompletions()` 會遍歷 `classicRules.getCompletionGroups()` 回傳的所有約束群組（9 行 + 9 列 + 9 宮 = 27 組）。每個已完成的群組以字串鍵追蹤（例如 `"row-0"`、`"col-5"`、`"box-8"`），存放於 `Set<string>`。新完成的群組會觸發 600ms 的閃爍動畫。

### 錯誤偵測（`src/composables/useSudoku.ts`）

錯誤標記採用**規則衝突偵測**而非比對正確答案：

- `hasConflict(row, col, value)` — 檢查同行/列/宮是否有重複數字
- `updateErrors()` — 每次格子變更後，重新掃描全盤更新 `isError` 狀態

這代表玩家填入錯誤但不重複的數字**不會立即標紅**，只有違反數獨規則（同行/列/宮重複）才會顯示紅字。擦除格子後也會重新計算，確保衝突解除後恢復正常。

**如果要改回比對答案的模式**：將 `useSudoku.ts` 中 `setCellValue` 的 `updateErrors()` 替換為：
```typescript
cell.isError = value !== 0 && value !== cell.solution
```

### 謎題產生流程

1. **填充** — 回溯演算法以隨機數字順序填滿空白 9×9 格線，產生完整的合法解答。
2. **移除** — 以隨機順序逐一移除格子。每次移除後，解的計數器會驗證謎題仍只有唯一解；若產生多組解，則還原該格。
3. **提示格數** — 當剩餘已填格數等於 `DifficultyConfig.clueCount` 時停止移除。

---

## 多語系（i18n）

### 架構

使用 `vue-i18n` v10 的 Composition API 模式（`legacy: false`）。

| 檔案 | 用途 |
|---|---|
| `src/i18n/index.ts` | 建立 i18n 實例，載入語系 JSON |
| `src/i18n/locales/zh-TW.json` | 繁體中文（**預設語系**） |
| `src/i18n/locales/en.json` | 英文（**fallback 語系**） |
| `src/i18n/locales/ja.json` | 日文 |

### 使用方式

在元件中透過 `useI18n()` 取得 `t` 函式：

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <span>{{ t('status.steps') }}</span>
</template>
```

帶參數的翻譯（named interpolation）：

```vue
{{ t('controls.erase', { count: erasesLeft }) }}
```

對應的 JSON：`"erase": "清除 ({count})"`

動態翻譯鍵（用於難度標籤）：

```vue
{{ t(`difficulty.${difficulty}.label`) }}
```

### 翻譯鍵結構

```json
{
  "app":        { "title" },
  "nav":        { "settings", "records" },
  "victory":    { "heading", "difficulty", "time", "steps", "newGame", "congratulation" },
  "controls":   { "erase", "hint", "newGame" },
  "status":     { "steps", "erases", "hints", "pause", "resume" },
  "records":    { "heading", "empty", "rank", "time", "steps" },
  "settings":   { "heading", "subtitle" },
  "difficulty":  { "easy": { "label", "desc" }, "normal": {...}, "hard": {...} },
  "common":     { "close" }
}
```

### 新增語系

1. 在 `src/i18n/locales/` 新增 JSON 檔（如 `ko.json`），複製 `en.json` 結構並翻譯
2. 在 `src/i18n/index.ts` 匯入並加入 `messages` 物件
3. 在 `src/App.vue` 的 `languages` 陣列新增選項：`{ value: 'ko', label: '한국어' }`

### 新增翻譯鍵

1. 在三個語系 JSON 中同時新增對應的鍵值
2. 在元件中使用 `t('your.new.key')` 或 `t('your.key', { param: value })`
3. 如果 fallback 語系（en）有該鍵，缺漏的語系會自動 fallback

---

## Cookie 持久化

### 架構（`src/utils/cookie.ts`）

提供兩個工具函式，所有需要持久化的偏好設定皆透過此模組讀寫：

```typescript
getCookie(name: string): string | null   // 讀取 cookie
setCookie(name: string, value: string)    // 寫入 cookie（有效期 1 年）
```

### 目前持久化的設定

| Cookie 名稱 | 用途 | 讀取位置 | 寫入位置 |
|---|---|---|---|
| `locale` | 語言偏好 | `src/i18n/index.ts`（初始化時） | `src/App.vue`（切換語言時） |
| `difficulty` | 難度偏好 | `src/composables/useGame.ts`（初始化時） | `src/App.vue`（選擇難度時）、`useGame.ts`（開始新遊戲時） |

### 新增持久化設定

1. 在寫入處呼叫 `setCookie('yourKey', value)`
2. 在讀取處呼叫 `getCookie('yourKey')` 並設定預設值

---

## 暫停功能

### 架構（`src/composables/useGame.ts`）

- `isPaused: Ref<boolean>` — 暫停狀態
- `togglePause()` — 切換暫停（僅在遊戲進行中有效）

### 暫停時的行為

| 操作 | 暫停時是否可用 |
|---|---|
| 計時器 | 停止計時 |
| 選取格子 | 禁止（`selectCell` 內檢查 `isPaused`） |
| 填入數字 | 禁止（`placeNumber` 內檢查 `isPaused`） |
| 擦除 | 禁止（`eraseCell` 內檢查 `isPaused`） |
| 提示 | 禁止（`useHint` 內檢查 `isPaused`） |
| 數字鍵盤 | 禁用（`NumberPad` 的 `:disabled` prop） |
| 開始新遊戲 | 可用（會自動解除暫停） |

### UI 位置

暫停按鈕位於 `App.vue` 的計時器旁邊，通關後自動隱藏（`v-if="!isComplete"`）。

---

## 通關動畫（`src/components/FireworkCanvas.vue`）

### 架構

全螢幕 `<canvas>` 元件，使用 `requestAnimationFrame` 驅動兩階段動畫：

#### Props

| Prop | 類型 | 說明 |
|---|---|---|
| `text` | `string?` | 粒子匯聚後顯示的文字（預設 `'恭喜通關'`） |

#### 動畫時間軸

| 時間 | 階段 | 說明 |
|---|---|---|
| 0 ~ 3.5 秒 | 密集煙火 | 火箭從底部升空，到達目標高度後爆發（50~90 顆粒子），初始 3 發快速連射後持續隨機發射 |
| 3.5 秒 | 文字粒子啟動 | 透過 offscreen canvas 渲染文字 → 取樣像素座標 → 產生約 2000 顆金色粒子，從畫面四周邊緣飛向目標位置 |
| 3.5 ~ 5 秒 | 匯聚 + 零星煙火 | 粒子以 `easeOutCubic` 緩動匯聚成文字，背景仍有低頻率煙火（0.8~2 秒間隔） |
| 5 ~ 8 秒 | 文字閃爍 + 零星煙火 | 文字粒子定位後持續波浪式閃爍，背景煙火繼續 |

#### 關鍵常數

在 `FireworkCanvas.vue` 頂部可調整：

```typescript
const FIREWORK_DURATION = 7500    // 煙火持續時間（ms）
const TEXT_GATHER_START = 3500    // 文字粒子開始匯聚的時間（ms）
const TEXT_GATHER_DURATION = 1500 // 匯聚完成所需時間（ms）
```

#### 觸發方式

在 `App.vue` 中，通關時設定 `showFireworks = true`，8 秒後自動關閉：

```typescript
showFireworks.value = true
setTimeout(() => { showFireworks.value = false }, 8000)
```

### 粒子系統詳細說明

#### 煙火粒子（Particle）

- **雙環爆發**：外環 50~90 顆、內環約 40%，速度和大小不同
- **8 種色系**：indigo、sky、violet、emerald、orange、pink、amber、red
- **尾跡**：每顆粒子保留最近 5 個位置，以半透明繪製
- **閃爍**：30% 的粒子帶有隨機 `shadowBlur` 光暈
- **二次爆發**：粒子消逝前有 6% 機率產生微型二次爆炸（8~14 顆小粒子）
- **物理**：重力 0.03/frame、阻力 0.985/frame

#### 火箭（Rocket）

- 從畫面底部隨機 X 位置發射，垂直速度 8~13
- 帶有 12 幀尾跡，到達目標高度後爆炸
- 30% 機率雙發齊射

#### 文字粒子（TextParticle）

- **取樣**：offscreen canvas 渲染文字後，以 2px 間距掃描像素，最多 2000 顆
- **起始位置**：隨機分布在畫面四個邊緣
- **匯聚**：每顆粒子有 0~0.4 的隨機延遲（交錯效果），以 `easeOutCubic` 移向目標
- **閃爍**：定位後以 `sin` 波浪式調變亮度

### 自訂調整

| 想調整的效果 | 修改位置 |
|---|---|
| 煙火顏色 | `palettes` 陣列 |
| 文字粒子顏色 | `textColors` 陣列 |
| 爆發粒子數 | `createExplosion()` 的 `count` 參數 |
| 文字大小 | `sampleTextPixels()` 的 `fontSize` 計算 |
| 文字粒子密度 | `initTextParticles()` 的 `maxParticles` 常數 |
| 煙火頻率 | `scheduleLaunches()` 的 `delay` 計算 |
| 物理參數 | `animate()` 中的 gravity（0.03）和 friction（0.985） |
| 動畫總時長 | `App.vue` 中 `setTimeout` 的時間 + `FIREWORK_DURATION` 常數 |

---

## Favicon（`public/sudoku.svg`）

SVG 格式的數獨風格圖示：

- 深色背景（`#1e293b`）搭配圓角矩形
- indigo 色粗線劃分 3×3 宮格，灰色細線劃分小格
- 白色數字代表已知提示、indigo 色數字代表玩家填入

在 `index.html` 中以 `<link rel="icon" type="image/svg+xml" href="/sudoku.svg" />` 引用。

若要更換圖示，替換 `public/sudoku.svg` 即可。

---

## 開發慣例

- **僅使用 Composition API** — 所有邏輯使用 `<script setup>` 搭配 composables，不使用 Options API。
- **Props 向下、Events 向上** — 元件為無狀態的顯示層；`useGame` 是唯一的狀態來源。
- **禁止魔術數字** — 格線尺寸、合法數字、宮格大小來自 `classicRules`；難度參數來自 `DIFFICULTY_CONFIGS`。
- **TypeScript 嚴格模式** — 建置時先執行 `vue-tsc` 型別檢查；所有型別皆為顯式宣告。
- **Tailwind 工具類別** — 不使用自訂 CSS 類別；所有樣式皆為行內 Tailwind。
- **i18n 翻譯** — 所有面向使用者的文字必須使用 `t()` 函式，禁止硬編碼文字。
- **Cookie 持久化** — 使用者偏好（語言、難度）透過 `src/utils/cookie.ts` 統一管理。
