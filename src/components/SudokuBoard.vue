<script setup lang="ts">
import type { Board } from '../types/sudoku'
import SudokuCell from './SudokuCell.vue'
import { computed, onMounted, onUnmounted } from 'vue'
import { classicRules } from '../utils/rules'

const props = defineProps<{
  board: Board
  selectedCell: { row: number; col: number } | null
  completedGroups: Set<string>
  newlyCompleted: string[]
}>()

const emit = defineEmits<{
  selectCell: [row: number, col: number]
}>()

const selectedValue = computed(() => {
  if (!props.selectedCell || props.board.length === 0) return 0
  return props.board[props.selectedCell.row]?.[props.selectedCell.col]?.value ?? 0
})

function isRelated(row: number, col: number): boolean {
  if (!props.selectedCell) return false
  const { row: sr, col: sc } = props.selectedCell
  if (row === sr && col === sc) return false
  return (
    row === sr ||
    col === sc ||
    (classicRules.getBoxIndex(row, col) === classicRules.getBoxIndex(sr, sc))
  )
}

function isSameNumber(row: number, col: number): boolean {
  if (!props.selectedCell || selectedValue.value === 0) return false
  const { row: sr, col: sc } = props.selectedCell
  if (row === sr && col === sc) return false
  return (props.board[row]?.[col]?.value ?? 0) === selectedValue.value
}

function isNewlyCompleted(row: number, col: number): boolean {
  if (props.newlyCompleted.length === 0) return false
  const boxIndex = classicRules.getBoxIndex(row, col)
  return props.newlyCompleted.some(key =>
    key === `row-${row}` || key === `col-${col}` || key === `box-${boxIndex}`
  )
}

const maxIndex = classicRules.gridSize - 1

function handleKeydown(e: KeyboardEvent) {
  if (!props.selectedCell) return

  const { row, col } = props.selectedCell
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      if (row > 0) emit('selectCell', row - 1, col)
      break
    case 'ArrowDown':
      e.preventDefault()
      if (row < maxIndex) emit('selectCell', row + 1, col)
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (col > 0) emit('selectCell', row, col - 1)
      break
    case 'ArrowRight':
      e.preventDefault()
      if (col < maxIndex) emit('selectCell', row, col + 1)
      break
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="inline-grid grid-cols-9 border-2 border-indigo-400/60 rounded-lg overflow-hidden gap-px bg-slate-600/30">
    <template v-for="row in classicRules.gridSize" :key="row">
      <SudokuCell
        v-for="col in classicRules.gridSize"
        :key="col"
        :cell="board[row - 1]![col - 1]!"
        :is-selected="selectedCell?.row === row - 1 && selectedCell?.col === col - 1"
        :is-same-number="isSameNumber(row - 1, col - 1)"
        :is-related="isRelated(row - 1, col - 1)"
        :is-newly-completed="isNewlyCompleted(row - 1, col - 1)"
        @select="emit('selectCell', row - 1, col - 1)"
      />
    </template>
  </div>
</template>
