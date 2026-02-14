<script setup lang="ts">
defineProps<{
  steps: number
  erasesLeft: number
  hintsLeft: number
}>()
</script>

<template>
  <div class="flex gap-4 text-sm text-slate-400">
    <span>Steps: <span class="text-slate-200 font-semibold">{{ steps }}</span></span>
    <span>Erases: <span class="text-slate-200 font-semibold">{{ erasesLeft }}</span></span>
    <span>Hints: <span class="text-slate-200 font-semibold">{{ hintsLeft }}</span></span>
  </div>
</template>
