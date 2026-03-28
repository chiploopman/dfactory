export function InvoiceReferencePagination(props: {
  pageNumberToken: string;
  totalPagesToken: string;
  markerClassPreview: string;
}) {
  return (
    <div
      className={props.markerClassPreview}
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
    </div>
  );
}
