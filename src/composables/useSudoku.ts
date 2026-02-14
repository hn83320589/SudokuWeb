import { ref, computed } from 'vue'
import type { Board, Difficulty } from '../types/sudoku'
import { generatePuzzle } from '../utils/generator'
import { classicRules } from '../utils/rules'

export function useSudoku() {
  const board = ref<Board>([])
  const completedGroups = ref<Set<string>>(new Set())
  const newlyCompleted = ref<string[]>([])

  function initBoard(difficulty: Difficulty) {
    const { puzzle, solution } = generatePuzzle(difficulty)
    board.value = puzzle.map((row, r) =>
      row.map((val, c) => ({
        row: r,
        col: c,
        value: val,
        solution: solution[r]![c]!,
        isGiven: val !== 0,
        isError: false,
      }))
    )
    completedGroups.value = new Set()
    newlyCompleted.value = []
  }

  function hasConflict(row: number, col: number, value: number): boolean {
    for (const [r, c] of classicRules.getRelatedCells(row, col)) {
      const other = board.value[r]?.[c]
      if (other && other.value === value) return true
    }
    return false
  }

  function updateErrors() {
    for (const row of board.value) {
      for (const cell of row) {
        if (cell.isGiven || cell.value === 0) {
          cell.isError = false
        } else {
          cell.isError = hasConflict(cell.row, cell.col, cell.value)
        }
      }
    }
  }

  function setCellValue(row: number, col: number, value: number) {
    const cell = board.value[row]?.[col]
    if (!cell || cell.isGiven) return
    cell.value = value
    updateErrors()
    checkCompletions()
  }

  function clearCell(row: number, col: number) {
    const cell = board.value[row]?.[col]
    if (!cell || cell.isGiven) return
    cell.value = 0
    updateErrors()
    checkCompletions()
  }

  function checkCompletions() {
    const newly: string[] = []

    for (const group of classicRules.getCompletionGroups()) {
      const key = `${group.type}-${group.index}`
      if (completedGroups.value.has(key)) continue

      const isGroupComplete = group.cells.every(([r, c]) => {
        const cell = board.value[r]?.[c]
        return cell && cell.value === cell.solution
      })

      if (isGroupComplete) {
        completedGroups.value.add(key)
        newly.push(key)
      }
    }

    newlyCompleted.value = newly

    if (newly.length > 0) {
      setTimeout(() => {
        newlyCompleted.value = []
      }, 600)
    }
  }

  const isComplete = computed(() => {
    if (board.value.length === 0) return false
    return board.value.every(row =>
      row.every(cell => cell.value === cell.solution)
    )
  })

  return {
    board,
    completedGroups,
    newlyCompleted,
    isComplete,
    initBoard,
    setCellValue,
    clearCell,
  }
}
