import type { Difficulty } from '../types/sudoku'
import { DIFFICULTY_CONFIGS } from '../types/sudoku'
import { classicRules } from './rules'

type Grid = number[][]

function createEmptyGrid(): Grid {
  return Array.from({ length: classicRules.gridSize }, () =>
    Array<number>(classicRules.gridSize).fill(0)
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < classicRules.gridSize; row++) {
    for (let col = 0; col < classicRules.gridSize; col++) {
      if (grid[row]![col] === 0) {
        const nums = shuffle([...classicRules.validNumbers])
        for (const num of nums) {
          if (classicRules.isValid(grid, row, col, num)) {
            grid[row]![col] = num
            if (fillGrid(grid)) return true
            grid[row]![col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function countSolutions(grid: Grid, limit: number = 2): number {
  let count = 0
  function solve(): boolean {
    for (let row = 0; row < classicRules.gridSize; row++) {
      for (let col = 0; col < classicRules.gridSize; col++) {
        if (grid[row]![col] === 0) {
          for (const num of classicRules.validNumbers) {
            if (classicRules.isValid(grid, row, col, num)) {
              grid[row]![col] = num
              if (solve()) return true
              grid[row]![col] = 0
            }
          }
          return false
        }
      }
    }
    count++
    return count >= limit
  }
  solve()
  return count
}

function removeCells(solution: Grid, clueCount: number): Grid {
  const puzzle = solution.map(row => [...row])
  const positions = shuffle(
    Array.from({ length: classicRules.totalCells }, (_, i) => [
      Math.floor(i / classicRules.gridSize),
      i % classicRules.gridSize,
    ] as [number, number])
  )

  let remaining = classicRules.totalCells
  for (const [row, col] of positions) {
    if (remaining <= clueCount) break
    const backup = puzzle[row]![col]!
    puzzle[row]![col] = 0
    const copy = puzzle.map(r => [...r])
    if (countSolutions(copy) !== 1) {
      puzzle[row]![col] = backup
    } else {
      remaining--
    }
  }
  return puzzle
}

export function generatePuzzle(difficulty: Difficulty): { puzzle: Grid; solution: Grid } {
  const solution = createEmptyGrid()
  fillGrid(solution)
  const clueCount = DIFFICULTY_CONFIGS[difficulty].clueCount
  const puzzle = removeCells(solution, clueCount)
  return { puzzle, solution }
}
