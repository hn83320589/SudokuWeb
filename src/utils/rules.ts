export interface SudokuRules {
  readonly gridSize: number
  readonly boxWidth: number
  readonly boxHeight: number
  readonly validNumbers: readonly number[]
  readonly totalCells: number

  /** Return all cells that conflict with (row, col) — same row, col, box */
  getRelatedCells(row: number, col: number): [number, number][]

  /** Check if placing num at (row, col) violates any constraint */
  isValid(grid: number[][], row: number, col: number, num: number): boolean

  /** Return all constraint groups for completion detection */
  getCompletionGroups(): { type: string; index: number; cells: [number, number][] }[]

  /** Determine which box index a cell belongs to */
  getBoxIndex(row: number, col: number): number

  /** Whether a cell is on a box left boundary (for UI borders) */
  isBoxLeftEdge(col: number): boolean

  /** Whether a cell is on a box top boundary (for UI borders) */
  isBoxTopEdge(row: number): boolean
}

export function createClassicRules(): SudokuRules {
  const gridSize = 9
  const boxWidth = 3
  const boxHeight = 3
  const validNumbers = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const totalCells = gridSize * gridSize

  function getRelatedCells(row: number, col: number): [number, number][] {
    const cells: [number, number][] = []
    const seen = new Set<string>()

    for (let i = 0; i < gridSize; i++) {
      if (i !== col) {
        cells.push([row, i])
        seen.add(`${row},${i}`)
      }
      if (i !== row) {
        const key = `${i},${col}`
        if (!seen.has(key)) {
          cells.push([i, col])
          seen.add(key)
        }
      }
    }

    const boxRow = Math.floor(row / boxHeight) * boxHeight
    const boxCol = Math.floor(col / boxWidth) * boxWidth
    for (let r = boxRow; r < boxRow + boxHeight; r++) {
      for (let c = boxCol; c < boxCol + boxWidth; c++) {
        const key = `${r},${c}`
        if (!seen.has(key) && !(r === row && c === col)) {
          cells.push([r, c])
          seen.add(key)
        }
      }
    }

    return cells
  }

  function isValid(grid: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < gridSize; i++) {
      if (grid[row]![i] === num) return false
      if (grid[i]![col] === num) return false
    }
    const boxRow = Math.floor(row / boxHeight) * boxHeight
    const boxCol = Math.floor(col / boxWidth) * boxWidth
    for (let r = boxRow; r < boxRow + boxHeight; r++) {
      for (let c = boxCol; c < boxCol + boxWidth; c++) {
        if (grid[r]![c] === num) return false
      }
    }
    return true
  }

  function getCompletionGroups(): { type: string; index: number; cells: [number, number][] }[] {
    const groups: { type: string; index: number; cells: [number, number][] }[] = []

    for (let i = 0; i < gridSize; i++) {
      const rowCells: [number, number][] = []
      const colCells: [number, number][] = []
      for (let j = 0; j < gridSize; j++) {
        rowCells.push([i, j])
        colCells.push([j, i])
      }
      groups.push({ type: 'row', index: i, cells: rowCells })
      groups.push({ type: 'col', index: i, cells: colCells })
    }

    for (let i = 0; i < gridSize; i++) {
      const br = Math.floor(i / boxWidth) * boxHeight
      const bc = (i % boxWidth) * boxWidth
      const boxCells: [number, number][] = []
      for (let r = br; r < br + boxHeight; r++) {
        for (let c = bc; c < bc + boxWidth; c++) {
          boxCells.push([r, c])
        }
      }
      groups.push({ type: 'box', index: i, cells: boxCells })
    }

    return groups
  }

  function getBoxIndex(row: number, col: number): number {
    return Math.floor(row / boxHeight) * boxWidth + Math.floor(col / boxWidth)
  }

  function isBoxLeftEdge(col: number): boolean {
    return col % boxWidth === 0 && col !== 0
  }

  function isBoxTopEdge(row: number): boolean {
    return row % boxHeight === 0 && row !== 0
  }

  return {
    gridSize,
    boxWidth,
    boxHeight,
    validNumbers,
    totalCells,
    getRelatedCells,
    isValid,
    getCompletionGroups,
    getBoxIndex,
    isBoxLeftEdge,
    isBoxTopEdge,
  }
}

export const classicRules = createClassicRules()
