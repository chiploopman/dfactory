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
  issuedAt: string;
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
  <main style="font-family: Inter, sans-serif; padding: 32px; color: #1a1a1a">
    <header style="margin-bottom: 24px">
      <h1 style="margin: 0; font-size: 28px">Invoice {{ props.payload.invoiceNumber }}</h1>
      <p style="margin-top: 8px; color: #444">Customer: {{ props.payload.customerName }}</p>
      <p style="margin-top: 0; color: #666">Issued at: {{ props.payload.issuedAt }}</p>
    </header>

    <table style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; border-bottom: 2px solid #ddd; padding: 8px">Item</th>
          <th style="text-align: right; border-bottom: 2px solid #ddd; padding: 8px">Qty</th>
          <th style="text-align: right; border-bottom: 2px solid #ddd; padding: 8px">Price</th>
          <th style="text-align: right; border-bottom: 2px solid #ddd; padding: 8px">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in props.payload.items" :key="item.name">
          <td style="border-bottom: 1px solid #eee; padding: 8px">{{ item.name }}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px">{{ item.qty }}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px">${{ item.price.toFixed(2) }}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px">
            ${{ (item.qty * item.price).toFixed(2) }}
          </td>
        </tr>
      </tbody>
    </table>

    <footer style="margin-top: 20px; text-align: right">
      <p style="font-size: 18px; font-weight: 700">Total: ${{ total.toFixed(2) }}</p>
    </footer>
  </main>
</template>
