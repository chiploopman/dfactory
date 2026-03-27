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

const props = defineProps<{
  payload: InvoicePayload;
}>();

const total = computed(() => {
  return props.payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
});
</script>

<template>
  <main style="font-family: Inter, sans-serif; padding: 24px">
    <h1 style="margin-bottom: 8px">Invoice {{ props.payload.invoiceNumber }}</h1>
    <p style="color: #555; margin-top: 0">Customer: {{ props.payload.customerName }}</p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px">
      <thead>
        <tr>
          <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px">Item</th>
          <th style="text-align: right; border-bottom: 1px solid #ddd; padding: 8px">Qty</th>
          <th style="text-align: right; border-bottom: 1px solid #ddd; padding: 8px">Price</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in props.payload.items" :key="item.name">
          <td style="border-bottom: 1px solid #eee; padding: 8px">{{ item.name }}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px">{{ item.qty }}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px">
            ${{ (item.price * item.qty).toFixed(2) }}
          </td>
        </tr>
      </tbody>
    </table>

    <p style="text-align: right; margin-top: 16px; font-weight: 700">Total: ${{ total.toFixed(2) }}</p>
  </main>
</template>
