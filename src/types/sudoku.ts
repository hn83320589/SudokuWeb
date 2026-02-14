export type Difficulty = 'easy' | 'normal' | 'hard'

export interface Cell {
  row: number
  col: number
  value: number      // 0 = empty
  solution: number   // correct answer
  isGiven: boolean   // pre-filled clue
  isError: boolean   // user placed wrong number
}

export type Board = Cell[][]

export interface DifficultyConfig {
  label: string
  description: string
  clueCount: number
  maxErases: number
  maxHints: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', description: '~38 clues', clueCount: 38, maxErases: 8, maxHints: 5 },
  normal: { label: 'Normal', description: '~30 clues', clueCount: 30, maxErases: 5, maxHints: 3 },
  hard: { label: 'Hard', description: '~24 clues', clueCount: 24, maxErases: 3, maxHints: 1 },
}

export interface GameRecord {
  difficulty: Difficulty
  time: number      // seconds
  steps: number
  date: Date
}
