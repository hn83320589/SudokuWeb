import { classicRules } from './rules'

type Grid = number[][]

export function solve(grid: Grid): Grid | null {
  const copy = grid.map(r => [...r])
  if (solveInPlace(copy)) return copy
  return null
}

function solveInPlace(grid: Grid): boolean {
  for (let row = 0; row < classicRules.gridSize; row++) {
    for (let col = 0; col < classicRules.gridSize; col++) {
      if (grid[row]![col] === 0) {
        for (const num of classicRules.validNumbers) {
          if (classicRules.isValid(grid, row, col, num)) {
            grid[row]![col] = num
            if (solveInPlace(grid)) return true
            grid[row]![col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

export function getHint(_grid: number[][], solution: Grid, row: number, col: number): number {
  return solution[row]![col]!
}
