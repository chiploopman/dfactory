<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <div
    style="
      transform: rotate(-24deg);
      font-size: 52px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: rgba(79, 70, 229, 0.14);
      text-transform: uppercase;
    "
  >
    {{ text }}
  </div>
</template>
