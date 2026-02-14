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

不使用路由器或狀態管理套件，整個應用程式由 composables 驅動。

## 專案結構

```
src/
├── main.ts                     # 應用程式進入點
├── App.vue                     # 根元件——串接所有邏輯與子元件
├── style.css                   # 全域樣式 / Tailwind 匯入
├── types/
│   └── sudoku.ts               # 共用型別：Cell、Board、Difficulty、DifficultyConfig
├── utils/
│   ├── rules.ts                # SudokuRules 介面 + classicRules 單例
│   ├── generator.ts            # 謎題產生（填充 + 唯一解驗證移除）
│   └── solver.ts               # 回溯求解器 + 提示查詢
├── composables/
│   ├── useSudoku.ts            # 棋盤狀態、格子操作、完成偵測
│   ├── useGame.ts              # 遊戲回合：計時、步數、擦除、提示、難度
│   └── useRecords.ts           # 記憶體內遊戲紀錄
└── components/
    ├── SudokuBoard.vue         # 9x9 格線——選取、鍵盤導航、高亮邏輯
    ├── SudokuCell.vue          # 單一格子——顯示、樣式、宮格邊框
    ├── NumberPad.vue           # 1-9 輸入按鈕 + 鍵盤監聽
    ├── GameControls.vue        # 擦除 / 提示 / 新遊戲按鈕
    ├── GameTimer.vue           # 分:秒 顯示
    ├── GameStatus.vue          # 步數 / 擦除次數 / 提示次數
    ├── SettingsModal.vue       # 難度選擇（下局生效）
    ├── RecordsModal.vue        # 歷史遊戲紀錄
    └── FireworkCanvas.vue      # 勝利煙火動畫
```

## 架構設計

### 資料流

```
App.vue
  └─ useGame()            ← 擁有所有遊戲狀態
       └─ useSudoku()     ← 擁有棋盤 + 完成偵測
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

匯出的 `classicRules` 單例實作標準 9x9 數獨規則。所有檔案皆從此單一來源匯入，程式碼中不再散落魔術數字（`9`、`3`、`81`）。

**新增變體玩法**（例如對角線數獨）：建立新的 `SudokuRules` 實作，在 `getCompletionGroups()` 加入對角線約束群組，並在 `isValid()` 中檢查對角線即可。

### 難度設定（`src/types/sudoku.ts`）

每個難度等級由 `DifficultyConfig` 完整描述：

```typescript
interface DifficultyConfig {
  label: string        // 顯示名稱
  description: string  // 說明文字
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

### 完成偵測

當格子數值改變時，`useSudoku.checkCompletions()` 會遍歷 `classicRules.getCompletionGroups()` 回傳的所有約束群組（9 行 + 9 列 + 9 宮 = 27 組）。每個已完成的群組以字串鍵追蹤（例如 `"row-0"`、`"col-5"`、`"box-8"`），存放於 `Set<string>`。新完成的群組會觸發 600ms 的閃爍動畫。

### 謎題產生流程

1. **填充** — 回溯演算法以隨機數字順序填滿空白 9x9 格線，產生完整的合法解答。
2. **移除** — 以隨機順序逐一移除格子。每次移除後，解的計數器會驗證謎題仍只有唯一解；若產生多組解，則還原該格。
3. **提示格數** — 當剩餘已填格數等於 `DifficultyConfig.clueCount` 時停止移除。

## 開發慣例

- **僅使用 Composition API** — 所有邏輯使用 `<script setup>` 搭配 composables，不使用 Options API。
- **Props 向下、Events 向上** — 元件為無狀態的顯示層；`useGame` 是唯一的狀態來源。
- **禁止魔術數字** — 格線尺寸、合法數字、宮格大小來自 `classicRules`；難度參數來自 `DIFFICULTY_CONFIGS`。
- **TypeScript 嚴格模式** — 建置時先執行 `vue-tsc` 型別檢查；所有型別皆為顯式宣告。
- **Tailwind 工具類別** — 不使用自訂 CSS 類別；所有樣式皆為行內 Tailwind。

## 規則重構變更紀錄

以下為抽取規則抽象層時所做的變更：

| 檔案 | 變更內容 |
|---|---|
| `src/utils/rules.ts` | **新增** — `SudokuRules` 介面 + `classicRules` 實作 |
| `src/types/sudoku.ts` | 新增 `DifficultyConfig` + `DIFFICULTY_CONFIGS`；移除未使用的 `GameState` |
| `src/utils/generator.ts` | 移除行內 `isValid`；改用 `classicRules` + `DIFFICULTY_CONFIGS` |
| `src/utils/solver.ts` | 移除行內 `isValid`；改用 `classicRules` |
| `src/composables/useSudoku.ts` | 將 3 個獨立的完成 Set 替換為泛用的 `completedGroups: Set<string>`，使用 `classicRules.getCompletionGroups()` |
| `src/composables/useGame.ts` | 從 `DIFFICULTY_CONFIGS` 讀取擦除 / 提示次數，取代寫死的數值 |
| `src/components/SudokuBoard.vue` | 使用 `classicRules.gridSize`、`classicRules.getBoxIndex()` |
| `src/components/SudokuCell.vue` | 使用 `classicRules.isBoxLeftEdge()` / `isBoxTopEdge()` |
| `src/components/NumberPad.vue` | 使用 `classicRules.validNumbers` |
| `src/components/SettingsModal.vue` | 從 `DIFFICULTY_CONFIGS` 動態產生難度選項 |
| `src/App.vue` | 更新 prop 名稱以對應新的泛用完成型別 |
