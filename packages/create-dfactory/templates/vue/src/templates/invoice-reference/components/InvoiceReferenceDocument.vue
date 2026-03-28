<script setup lang="ts">
import { computed } from "vue";

import type {
  InvoiceReferenceMarkerClasses,
  InvoiceReferencePayload
} from "./types";

const props = defineProps<{
  payload: InvoiceReferencePayload;
  markerClasses: InvoiceReferenceMarkerClasses;
}>();

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);
}

function lineTotal(options: {
  qty: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}): number {
  const gross = options.qty * options.unitPrice;
  const discount = options.discount ?? 0;
  const discounted = gross - gross * (discount / 100);
  const taxRate = options.taxRate ?? 0;
  return discounted + discounted * (taxRate / 100);
}

const accent = computed(() => props.payload.brand?.accentColor ?? "#4f46e5");
const subtotal = computed(() => {
  return props.payload.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
});
const total = computed(() => {
  return props.payload.items.reduce((sum, item) => {
    return sum + lineTotal(item);
  }, 0);
});
</script>

<template>
  <main style="font-family: Inter, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.55">
    <header
      :class="props.markerClasses.keepWithNext"
      style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 18px"
    >
      <h1 :style="{ margin: 0, color: accent }">Invoice {{ props.payload.invoiceNumber }}</h1>
      <p style="margin: 6px 0 0; color: #475569">
        Issued {{ props.payload.issuedAt }} • Due {{ props.payload.dueAt }}
      </p>
      <p v-if="props.payload.purchaseOrder" style="margin: 4px 0 0; color: #64748b">
        Purchase Order: {{ props.payload.purchaseOrder }}
      </p>
    </header>

    <section
      style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px"
    >
      <article :class="props.markerClasses.avoidBreak">
        <h2 style="font-size: 16px; margin-bottom: 8px">Bill From</h2>
        <p style="margin: 0; font-weight: 600">{{ props.payload.company.name }}</p>
        <p style="margin: 4px 0 0; color: #475569; white-space: pre-line">
          {{ props.payload.company.address }}
        </p>
        <p style="margin: 8px 0 0; color: #334155">
          {{ props.payload.company.email }} • {{ props.payload.company.phone }}
        </p>
        <p style="margin: 4px 0 0; color: #64748b">
          {{ props.payload.company.website }} • Tax ID {{ props.payload.company.taxId }}
        </p>
      </article>

      <article :class="props.markerClasses.avoidBreak">
        <h2 style="font-size: 16px; margin-bottom: 8px">Bill To</h2>
        <p style="margin: 0; font-weight: 600">{{ props.payload.customer.name }}</p>
        <p style="margin: 4px 0 0; color: #475569">
          Contact: {{ props.payload.customer.contact }}
        </p>
        <p style="margin: 4px 0 0; color: #334155">{{ props.payload.customer.email }}</p>
        <p style="margin: 4px 0 0; color: #64748b; white-space: pre-line">
          {{ props.payload.customer.address }}
        </p>
      </article>
    </section>

    <section :class="props.markerClasses.avoidBreak">
      <h2 style="font-size: 16px; margin: 20px 0 8px">Services & Deliverables</h2>
      <table
        style="
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        "
      >
        <thead style="background-color: #eef2ff">
          <tr>
            <th style="text-align: left; padding: 10px 12px">Description</th>
            <th style="text-align: right; padding: 10px 12px">Qty</th>
            <th style="text-align: right; padding: 10px 12px">Unit</th>
            <th style="text-align: right; padding: 10px 12px">Discount</th>
            <th style="text-align: right; padding: 10px 12px">Tax</th>
            <th style="text-align: right; padding: 10px 12px">Line Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in props.payload.items" :key="item.id">
            <td style="padding: 10px 12px; border-top: 1px solid #e2e8f0">
              <p style="margin: 0; font-weight: 600">{{ item.name }}</p>
              <p v-if="item.description" style="margin: 4px 0 0; color: #64748b">
                {{ item.description }}
              </p>
            </td>
            <td style="text-align: right; padding: 10px 12px; border-top: 1px solid #e2e8f0">
              {{ item.qty }}
            </td>
            <td style="text-align: right; padding: 10px 12px; border-top: 1px solid #e2e8f0">
              {{ formatMoney(item.unitPrice, props.payload.currency) }}
            </td>
            <td style="text-align: right; padding: 10px 12px; border-top: 1px solid #e2e8f0">
              {{ (item.discount ?? 0).toFixed(1) }}%
            </td>
            <td style="text-align: right; padding: 10px 12px; border-top: 1px solid #e2e8f0">
              {{ (item.taxRate ?? 0).toFixed(1) }}%
            </td>
            <td
              style="
                text-align: right;
                padding: 10px 12px;
                border-top: 1px solid #e2e8f0;
                font-weight: 600;
              "
            >
              {{ formatMoney(lineTotal(item), props.payload.currency) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section
      style="
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 24px;
      "
    >
      <article>
        <h2 style="font-size: 16px; margin-bottom: 8px">Summary Notes</h2>
        <p style="color: #475569; margin-top: 0">
          The sections below intentionally include long-form text to provide a strong multi-page
          reference for TOC, pagination, and marker helpers.
        </p>
        <section
          v-for="(section, index) in props.payload.sections"
          :key="`${section.title}-${index}`"
          :class="index === 2 ? props.markerClasses.pageBreakBefore : undefined"
          style="
            margin-top: 14px;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
          "
        >
          <h3 style="margin-top: 0; margin-bottom: 8px; color: #1e293b">{{ section.title }}</h3>
          <p style="margin: 0; color: #334155">{{ section.description }}</p>
          <p v-if="section.notes" style="margin: 8px 0 0; color: #64748b">{{ section.notes }}</p>
        </section>
      </article>

      <aside
        :class="props.markerClasses.keepWithNext"
        style="
          border: 1px solid #dbeafe;
          background: #eff6ff;
          border-radius: 10px;
          padding: 14px;
        "
      >
        <h2 style="margin: 0; font-size: 15px">Totals</h2>
        <p style="margin: 10px 0 0; color: #475569">
          Subtotal: <strong>{{ formatMoney(subtotal, props.payload.currency) }}</strong>
        </p>
        <p style="margin: 6px 0 0; color: #475569">
          Grand Total: <strong>{{ formatMoney(total, props.payload.currency) }}</strong>
        </p>
        <div
          style="
            height: 1px;
            background: rgba(71, 85, 105, 0.2);
            margin-top: 10px;
            margin-bottom: 8px;
          "
        />
        <p style="margin: 10px 0 0; color: #1e293b; font-weight: 600">
          Payment via {{ props.payload.payment.bankName }}
        </p>
        <p style="margin: 4px 0 0; color: #475569">IBAN: {{ props.payload.payment.iban }}</p>
        <p style="margin: 4px 0 0; color: #475569">SWIFT: {{ props.payload.payment.swift }}</p>
        <p v-if="props.payload.payment.instructions" style="margin: 8px 0 0; color: #64748b">
          {{ props.payload.payment.instructions }}
        </p>
      </aside>
    </section>

    <section
      v-if="props.payload.notes"
      :class="props.markerClasses.pageBreakBefore"
      style="
        margin-top: 20px;
        padding: 16px;
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
      "
    >
      <h2 style="margin-top: 0; font-size: 16px">Additional Terms</h2>
      <p style="margin-bottom: 0; color: #334155; white-space: pre-line">
        {{ props.payload.notes }}
      </p>
    </section>
  </main>
</template>
