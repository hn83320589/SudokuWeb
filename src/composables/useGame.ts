import { ref, watch, onUnmounted } from 'vue'
import type { Difficulty } from '../types/sudoku'
import { DIFFICULTY_CONFIGS } from '../types/sudoku'
import { useSudoku } from './useSudoku'

export function useGame() {
  const {
    board,
    completedGroups,
    newlyCompleted,
    isComplete,
    initBoard,
    setCellValue,
    clearCell,
  } = useSudoku()

  const difficulty = ref<Difficulty>('normal')
  const nextDifficulty = ref<Difficulty>('normal')
  const selectedCell = ref<{ row: number; col: number } | null>(null)
  const timer = ref(0)
  const steps = ref(0)
  const erasesLeft = ref(DIFFICULTY_CONFIGS['normal'].maxErases)
  const hintsLeft = ref(DIFFICULTY_CONFIGS['normal'].maxHints)
  const isRunning = ref(false)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    if (timerInterval) return
    isRunning.value = true
    timerInterval = setInterval(() => {
      timer.value++
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    isRunning.value = false
  }

  watch(isComplete, (complete) => {
    if (complete) stopTimer()
  })

  function selectCell(row: number, col: number) {
    selectedCell.value = { row, col }
  }

  function placeNumber(num: number) {
    if (!selectedCell.value || isComplete.value) return
    const { row, col } = selectedCell.value
    const cell = board.value[row]?.[col]
    if (!cell || cell.isGiven) return
    if (cell.value === num) return

    if (!isRunning.value) startTimer()

    setCellValue(row, col, num)
    steps.value++
  }

  function eraseCell() {
    if (!selectedCell.value || isComplete.value) return
    if (erasesLeft.value <= 0) return
    const { row, col } = selectedCell.value
    const cell = board.value[row]?.[col]
    if (!cell || cell.isGiven || cell.value === 0) return

    clearCell(row, col)
    erasesLeft.value--
  }

  function useHint() {
    if (!selectedCell.value || isComplete.value) return
    if (hintsLeft.value <= 0) return
    const { row, col } = selectedCell.value
    const cell = board.value[row]?.[col]
    if (!cell || cell.isGiven) return
    if (cell.value === cell.solution) return

    if (!isRunning.value) startTimer()

    setCellValue(row, col, cell.solution)
    hintsLeft.value--
    steps.value++
  }

  function startNewGame() {
    stopTimer()
    difficulty.value = nextDifficulty.value
    const config = DIFFICULTY_CONFIGS[difficulty.value]
    timer.value = 0
    steps.value = 0
    erasesLeft.value = config.maxErases
    hintsLeft.value = config.maxHints
    selectedCell.value = null
    initBoard(difficulty.value)
  }

  onUnmounted(() => stopTimer())

  // Initialize first game
  initBoard(difficulty.value)

  return {
    board,
    selectedCell,
    difficulty,
    nextDifficulty,
    timer,
    steps,
    erasesLeft,
    hintsLeft,
    isRunning,
    isComplete,
    completedGroups,
    newlyCompleted,
    selectCell,
    placeNumber,
    eraseCell,
    useHint,
    startNewGame,
  }
}
