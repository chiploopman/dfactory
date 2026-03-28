<script setup lang="ts">
import type { TemplateTocHeading } from "@dfactory/core";

defineProps<{
  title: string;
  headings: TemplateTocHeading[];
}>();
</script>

<template>
  <nav
    :aria-label="title"
    style="
      margin-bottom: 24px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid rgba(79, 70, 229, 0.18);
      background: rgba(79, 70, 229, 0.04);
    "
  >
    <h2 style="margin: 0; font-size: 16px; color: #312e81">{{ title }}</h2>
    <ol style="margin: 10px 0 0; padding-left: 18px">
      <li
        v-for="heading in headings"
        :key="heading.id"
        :style="{ marginTop: '4px', marginLeft: `${(heading.level - 1) * 10}px` }"
      >
        <a :href="`#${heading.id}`" style="color: #1e293b; text-decoration: none">
          {{ heading.text }}
        </a>
      </li>
    </ol>
  </nav>
</template>
