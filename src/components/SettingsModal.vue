<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Difficulty } from '../types/sudoku'
import { DIFFICULTY_CONFIGS } from '../types/sudoku'

const { t } = useI18n()

defineProps<{
  currentDifficulty: Difficulty
}>()

const emit = defineEmits<{
  select: [difficulty: Difficulty]
  close: []
}>()

const difficulties = (Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(key => ({
  value: key,
  label: DIFFICULTY_CONFIGS[key].label,
  desc: DIFFICULTY_CONFIGS[key].description,
}))
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black/50" @click="emit('close')">
    <div class="bg-slate-800 border border-slate-600 rounded-2xl p-6 min-w-72 shadow-2xl" @click.stop>
      <h2 class="text-xl font-bold text-indigo-400 mb-4">{{ t('settings.heading') }}</h2>
      <p class="text-sm text-slate-400 mb-4">{{ t('settings.subtitle') }}</p>
      <div class="space-y-2">
        <button
          v-for="d in difficulties"
          :key="d.value"
          class="w-full px-4 py-3 rounded-lg text-left transition-colors cursor-pointer"
          :class="currentDifficulty === d.value
            ? 'bg-indigo-600/40 border border-indigo-400/50 text-indigo-200'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'"
          @click="emit('select', d.value)"
        >
          <span class="font-semibold">{{ t(d.label) }}</span>
          <span class="text-sm text-slate-400 ml-2">{{ t(d.desc) }}</span>
        </button>
      </div>
      <button
        class="mt-4 w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
        @click="emit('close')"
      >
        {{ t('common.close') }}
      </button>
    </div>
  </div>
</template>
