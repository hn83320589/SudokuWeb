<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  steps: number
  erasesLeft: number
  hintsLeft: number
}>()
</script>

<template>
  <div class="flex gap-4 text-sm text-slate-400">
    <span>{{ t('status.steps') }} <span class="text-slate-200 font-semibold">{{ steps }}</span></span>
    <span>{{ t('status.erases') }} <span class="text-slate-200 font-semibold">{{ erasesLeft }}</span></span>
    <span>{{ t('status.hints') }} <span class="text-slate-200 font-semibold">{{ hintsLeft }}</span></span>
  </div>
</template>
