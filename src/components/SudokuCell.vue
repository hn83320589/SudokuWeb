<script setup lang="ts">
import type { Cell } from '../types/sudoku'
import { classicRules } from '../utils/rules'
import { computed } from 'vue'

const props = defineProps<{
  cell: Cell
  isSelected: boolean
  isSameNumber: boolean
  isRelated: boolean
  isNewlyCompleted: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const displayValue = computed(() => props.cell.value || '')

const cellClasses = computed(() => {
  const classes: string[] = [
    'w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-lg font-mono cursor-pointer transition-all duration-150',
  ]

  if (props.isNewlyCompleted) {
    classes.push('animate-pulse bg-indigo-500/30')
  } else if (props.isSelected) {
    classes.push('bg-indigo-600/40 ring-2 ring-indigo-400')
  } else if (props.isSameNumber) {
    classes.push('bg-indigo-500/20')
  } else if (props.isRelated) {
    classes.push('bg-slate-700/60')
  } else {
    classes.push('bg-slate-800/40')
  }

  if (props.cell.isGiven) {
    classes.push('font-bold text-slate-100')
  } else if (props.cell.isError) {
    classes.push('text-red-400')
  } else if (props.cell.value) {
    classes.push('text-indigo-300')
  } else {
    classes.push('text-slate-400')
  }

  // Box borders
  const { row, col } = props.cell
  if (classicRules.isBoxLeftEdge(col)) classes.push('border-l-2 border-l-indigo-400/50')
  if (classicRules.isBoxTopEdge(row)) classes.push('border-t-2 border-t-indigo-400/50')

  return classes.join(' ')
})
</script>

<template>
  <div :class="cellClasses" @click="emit('select')">
    {{ displayValue }}
  </div>
</template>
