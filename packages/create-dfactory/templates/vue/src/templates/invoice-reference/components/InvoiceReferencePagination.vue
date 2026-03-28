<script setup lang="ts">
defineProps<{
  pageNumberToken: string;
  totalPagesToken: string;
  markerClassPreview: string;
}>();
</script>

<template>
  <div
    :class="markerClassPreview"
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
  </div>
</template>
