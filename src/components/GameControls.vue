<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  erasesLeft: number
  hintsLeft: number
  isComplete: boolean
}>()

const emit = defineEmits<{
  erase: []
  hint: []
  newGame: []
}>()
</script>

<template>
  <div class="flex gap-2 flex-wrap justify-center">
    <button
      :disabled="erasesLeft <= 0 || isComplete"
      class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      @click="emit('erase')"
    >
      {{ t('controls.erase', { count: erasesLeft }) }}
    </button>
    <button
      :disabled="hintsLeft <= 0 || isComplete"
      class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      @click="emit('hint')"
    >
      {{ t('controls.hint', { count: hintsLeft }) }}
    </button>
    <button
      class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors cursor-pointer"
      @click="emit('newGame')"
    >
      {{ t('controls.newGame') }}
    </button>
  </div>
</template>
