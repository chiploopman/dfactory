<script setup lang="ts">
import { computed } from "vue";

import {
  AvoidBreakInside,
  Document,
  Heading,
  KeepWithNext,
  NumericCell,
  Page,
  PageBreakBefore,
  Paragraph,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@dfactory/pdf-primitives-vue";

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
  <Document>
    <Page>
      <Section :style="{ padding: '24px' }">
        <KeepWithNext>
          <Heading as="h1" :style="{ marginBottom: '8px', color: 'var(--df-pdf-color-accent)' }">
            Invoice {{ props.payload.invoiceNumber }}
          </Heading>
          <Paragraph :style="{ color: 'var(--df-pdf-color-muted)', marginTop: 0 }">
            Customer: {{ props.payload.customerName }}
          </Paragraph>
          <Paragraph :style="{ color: 'var(--df-pdf-color-muted)', marginTop: '4px' }">
            Issued: {{ props.payload.issuedAt }}
          </Paragraph>
        </KeepWithNext>

        <AvoidBreakInside>
          <Heading as="h2" :style="{ marginTop: '20px', marginBottom: '8px', fontSize: '16px' }">
            Line Items
          </Heading>
          <Table :style="{ marginTop: '10px' }">
            <TableHead>
              <TableRow>
                <TableHeaderCell :style="{ textAlign: 'left' }">Item</TableHeaderCell>
                <TableHeaderCell :style="{ textAlign: 'right' }">Qty</TableHeaderCell>
                <TableHeaderCell :style="{ textAlign: 'right' }">Price</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow v-for="item in props.payload.items" :key="item.name">
                <TableCell>{{ item.name }}</TableCell>
                <NumericCell>{{ item.qty }}</NumericCell>
                <NumericCell>${{ (item.price * item.qty).toFixed(2) }}</NumericCell>
              </TableRow>
            </TableBody>
          </Table>

          <Paragraph :style="{ textAlign: 'right', marginTop: '16px', fontWeight: 700 }">
            Total: ${{ total.toFixed(2) }}
          </Paragraph>
        </AvoidBreakInside>

        <PageBreakBefore>
          <Heading as="h2" :style="{ marginTop: '24px', fontSize: '16px' }">Payment Terms</Heading>
          <Paragraph :style="{ color: 'var(--df-pdf-color-text)', lineHeight: 1.6 }">
            Payment due within 14 calendar days from invoice date. Late payments may incur additional
            charges.
          </Paragraph>
        </PageBreakBefore>
      </Section>
    </Page>
  </Document>
</template>
