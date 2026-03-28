<script setup lang="ts">
defineProps<{
  title: string;
  invoiceNumber: string;
  generatedAtToken: string;
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
    <span>{{ title }}</span>
    <span>{{ invoiceNumber }}</span>
    <span>{{ generatedAtToken }}</span>
  </div>
</template>
