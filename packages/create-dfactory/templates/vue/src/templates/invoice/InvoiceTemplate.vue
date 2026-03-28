<script setup lang="ts">
import { computed } from "vue";

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
}

interface InvoicePayload {
  invoiceNumber: string;
  customerName: string;
  items: InvoiceItem[];
}

interface MarkerClasses {
  keepWithNext: string;
  avoidBreak: string;
  pageBreakBefore: string;
}

const props = defineProps<{
  payload: InvoicePayload;
  markerClasses: MarkerClasses;
}>();

const total = computed(() => {
  return props.payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
});
</script>

<template>
  <main style="font-family: Inter, sans-serif; padding: 24px; color: #0f172a">
    <section :class="props.markerClasses.keepWithNext">
      <h1 style="margin-bottom: 8px">Invoice {{ props.payload.invoiceNumber }}</h1>
      <p style="color: #475569; margin-top: 0">Customer: {{ props.payload.customerName }}</p>
    </section>

    <section :class="props.markerClasses.avoidBreak">
      <h2 style="margin-top: 20px; margin-bottom: 8px; font-size: 16px">Line Items</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid #e2e8f0; padding: 8px">Item</th>
            <th style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 8px">Qty</th>
            <th style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 8px">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in props.payload.items" :key="item.name">
            <td style="border-bottom: 1px solid #f1f5f9; padding: 8px">{{ item.name }}</td>
            <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px">{{ item.qty }}</td>
            <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px">
              ${{ (item.price * item.qty).toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>

      <p style="text-align: right; margin-top: 16px; font-weight: 700">Total: ${{ total.toFixed(2) }}</p>
    </section>

    <section :class="props.markerClasses.pageBreakBefore">
      <h2 style="margin-top: 24px; font-size: 16px">Payment Terms</h2>
      <p style="color: #334155; line-height: 1.6">
        Payment due within 14 calendar days from invoice date. Late payments may incur additional charges.
      </p>
    </section>
  </main>
</template>
