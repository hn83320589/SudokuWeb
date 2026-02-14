import { reactive, computed } from 'vue'
import type { GameRecord, Difficulty } from '../types/sudoku'

const state = reactive<{ records: GameRecord[] }>({
  records: [],
})

export function useRecords() {
  function addRecord(record: GameRecord) {
    state.records.push(record)
  }

  function getRecords(difficulty: Difficulty): GameRecord[] {
    return state.records
      .filter(r => r.difficulty === difficulty)
      .sort((a, b) => a.time - b.time)
  }

  const records = computed(() => state.records)

  return { records, addRecord, getRecords }
}
