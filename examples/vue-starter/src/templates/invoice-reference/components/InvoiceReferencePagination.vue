<script setup lang="ts">
import { AvoidBreakInside } from "@dfactory/pdf-primitives-vue";

defineProps<{
  pageNumberToken: string;
  totalPagesToken: string;
}>();
</script>

<template>
  <AvoidBreakInside
    style="
      width: 100%;
      padding: 4px 16px 8px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    "
  >
    <span>DFactory Reference Pagination Layer</span>
    <span>Page {{ pageNumberToken }} of {{ totalPagesToken }}</span>
  </AvoidBreakInside>
</template>
