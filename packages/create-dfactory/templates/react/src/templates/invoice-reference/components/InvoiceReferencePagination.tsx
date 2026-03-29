import { AvoidBreakInside } from "@dfactory/pdf-primitives-react";

export function InvoiceReferencePagination(props: {
  pageNumberToken: string;
  totalPagesToken: string;
}) {
  return (
    <AvoidBreakInside
      style={{
        width: "100%",
        padding: "4px 16px 8px",
        fontSize: "9px",
        color: "#64748b",
        display: "flex",
        justifyContent: "space-between"
      }}
    >
      <span>DFactory Reference Pagination Layer</span>
      <span>
        Page {props.pageNumberToken} of {props.totalPagesToken}
      </span>
    </AvoidBreakInside>
  );
}
