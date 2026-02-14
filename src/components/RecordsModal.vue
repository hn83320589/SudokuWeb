<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Difficulty, GameRecord } from '../types/sudoku'

const { t } = useI18n()

const props = defineProps<{
  records: GameRecord[]
}>()

const emit = defineEmits<{
  close: []
}>()

const activeTab = ref<Difficulty>('normal')

const tabs: Difficulty[] = ['easy', 'normal', 'hard']

const filteredRecords = computed(() =>
  props.records
    .filter(r => r.difficulty === activeTab.value)
    .sort((a, b) => a.time - b.time)
)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black/50" @click="emit('close')">
    <div class="bg-slate-800 border border-slate-600 rounded-2xl p-6 min-w-80 max-w-sm shadow-2xl" @click.stop>
      <h2 class="text-xl font-bold text-indigo-400 mb-4">{{ t('records.heading') }}</h2>

      <div class="flex gap-1 mb-4">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer"
          :class="activeTab === tab
            ? 'bg-indigo-600/40 text-indigo-200'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'"
          @click="activeTab = tab"
        >
          {{ t(`difficulty.${tab}.label`) }}
        </button>
      </div>

      <div v-if="filteredRecords.length === 0" class="text-slate-500 text-sm py-4 text-center">
        {{ t('records.empty') }}
      </div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-slate-400 border-b border-slate-700">
            <th class="py-2 text-left">{{ t('records.rank') }}</th>
            <th class="py-2 text-left">{{ t('records.time') }}</th>
            <th class="py-2 text-left">{{ t('records.steps') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in filteredRecords" :key="index" class="border-b border-slate-700/50">
            <td class="py-2 text-slate-400">{{ index + 1 }}</td>
            <td class="py-2 text-indigo-300 font-mono">{{ formatTime(record.time) }}</td>
            <td class="py-2 text-slate-300">{{ record.steps }}</td>
          </tr>
        </tbody>
      </table>

      <button
        class="mt-4 w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
        @click="emit('close')"
      >
        {{ t('common.close') }}
      </button>
    </div>
  </div>
</template>
