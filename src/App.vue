<script setup lang="ts">
import SudokuBoard from './components/SudokuBoard.vue'
import NumberPad from './components/NumberPad.vue'
import GameControls from './components/GameControls.vue'
import GameTimer from './components/GameTimer.vue'
import GameStatus from './components/GameStatus.vue'
import SettingsModal from './components/SettingsModal.vue'

import FireworkCanvas from './components/FireworkCanvas.vue'
import { useGame } from './composables/useGame'
import { useRecords } from './composables/useRecords'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setCookie } from './utils/cookie'

const { locale, t } = useI18n()

const {
  board,
  selectedCell,
  difficulty,
  nextDifficulty,
  timer,
  steps,
  erasesLeft,
  hintsLeft,
  isComplete,
  completedGroups,
  newlyCompleted,
  selectCell,
  placeNumber,
  eraseCell,
  useHint,
  isPaused,
  togglePause,
  startNewGame,
} = useGame()

const { addRecord } = useRecords()

const showSettings = ref(false)

const showFireworks = ref(false)
const hasRecordedCompletion = ref(false)

const languages = [
  { value: 'zh-TW', label: '中文' },
  { value: 'en', label: 'EN' },
  { value: 'ja', label: '日本語' },
]

function changeLocale(lang: string) {
  locale.value = lang
  setCookie('locale', lang)
}

watch(isComplete, (complete) => {
  if (complete && !hasRecordedCompletion.value) {
    hasRecordedCompletion.value = true
    addRecord({
      difficulty: difficulty.value,
      time: timer.value,
      steps: steps.value,
      date: new Date(),
    })
    showFireworks.value = true
    setTimeout(() => {
      showFireworks.value = false
    }, 8000)
  }
})

function handleNewGame() {
  showFireworks.value = false
  hasRecordedCompletion.value = false
  startNewGame()
}


</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-4 px-2 select-none">
    <header class="flex items-center gap-4 mb-4">
      <h1 class="text-2xl font-bold text-indigo-400 tracking-wide">{{ t('app.title') }}</h1>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer"
          @click="showSettings = true"
        >
          {{ t('nav.settings') }}
        </button>
        <select
          :value="locale"
          class="px-2 py-1 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer border-none outline-none"
          @change="changeLocale(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="lang in languages" :key="lang.value" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>
      </div>
    </header>

    <div class="flex items-center gap-6 mb-3">
      <div class="flex items-center gap-2">
        <GameTimer :seconds="timer" />
        <button
          v-if="!isComplete"
          class="px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer"
          :class="isPaused
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'"
          @click="togglePause"
        >
          {{ isPaused ? t('status.resume') : t('status.pause') }}
        </button>
      </div>
      <GameStatus :steps="steps" :erases-left="erasesLeft" :hints-left="hintsLeft" />
    </div>

    <SudokuBoard
      :board="board"
      :selected-cell="selectedCell"
      :completed-groups="completedGroups"
      :newly-completed="newlyCompleted"
      @select-cell="selectCell"
    />

    <div class="mt-3 flex flex-col items-center gap-3">
      <NumberPad
        :disabled="isComplete || isPaused"
        @number="placeNumber"
      />
      <GameControls
        :erases-left="erasesLeft"
        :hints-left="hintsLeft"
        :is-complete="isComplete"
        @erase="eraseCell"
        @hint="useHint"
        @new-game="handleNewGame"
      />
    </div>

    <SettingsModal
      v-if="showSettings"
      :current-difficulty="nextDifficulty"
      @select="(d) => { nextDifficulty = d; setCookie('difficulty', d); showSettings = false }"
      @close="showSettings = false"
    />


    <FireworkCanvas v-if="showFireworks" :text="t('victory.congratulation')" />

    <!-- Victory overlay -->
    <div
      v-if="isComplete"
      class="fixed inset-0 flex items-center justify-center z-40 bg-black/50"
    >
      <div class="bg-slate-800 border border-indigo-500/30 rounded-2xl p-8 text-center shadow-2xl">
        <h2 class="text-3xl font-bold text-indigo-400 mb-4">{{ t('victory.heading') }}</h2>
        <div class="space-y-2 text-slate-300 mb-6">
          <p>{{ t('victory.difficulty') }} <span class="text-indigo-300 font-semibold">{{ t(`difficulty.${difficulty}.label`) }}</span></p>
          <p>{{ t('victory.time') }} <span class="text-indigo-300 font-semibold">{{ Math.floor(timer / 60) }}:{{ String(timer % 60).padStart(2, '0') }}</span></p>
          <p>{{ t('victory.steps') }} <span class="text-indigo-300 font-semibold">{{ steps }}</span></p>
        </div>
        <button
          class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          @click="handleNewGame"
        >
          {{ t('victory.newGame') }}
        </button>
      </div>
    </div>
  </div>
</template>
