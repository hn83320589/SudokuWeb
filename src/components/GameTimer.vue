<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  seconds: number
}>()

const display = computed(() => {
  const m = Math.floor(props.seconds / 60)
  const s = props.seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
</script>

<template>
  <div class="text-xl font-mono text-indigo-300 tabular-nums">
    {{ display }}
  </div>
</template>
