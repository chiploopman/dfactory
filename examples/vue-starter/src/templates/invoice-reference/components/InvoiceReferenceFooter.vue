<script setup lang="ts">
defineProps<{
  templateId: string;
  pageNumberToken: string;
  totalPagesToken: string;
  supportEmail?: string;
}>();
</script>

<template>
  <div
    style="
      width: 100%;
      padding: 0 14px;
      font-size: 9px;
      color: #475569;
      display: flex;
      justify-content: space-between;
      align-items: center;
    "
  >
    <span>{{ supportEmail ?? "billing@dfactory.dev" }}</span>
    <span>{{ templateId }}</span>
    <span>{{ pageNumberToken }} / {{ totalPagesToken }}</span>
  </div>
</template>
