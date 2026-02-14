<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { classicRules } from '../utils/rules'

defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  number: [num: number]
}>()

function handleKeydown(e: KeyboardEvent) {
  const num = parseInt(e.key)
  if (num >= 1 && num <= classicRules.gridSize) {
    emit('number', num)
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="flex gap-1.5 flex-wrap justify-center">
    <button
      v-for="n in classicRules.validNumbers"
      :key="n"
      :disabled="disabled"
      class="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-700 hover:bg-indigo-600/50 text-slate-200 font-semibold text-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      @click="emit('number', n)"
    >
      {{ n }}
    </button>
  </div>
</template>
