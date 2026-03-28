export function InvoiceReferenceHeader(props: {
  title: string;
  invoiceNumber: string;
  generatedAtToken: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        padding: "0 14px",
        fontSize: "9px",
        color: "#475569",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <span>{props.title}</span>
      <span>{props.invoiceNumber}</span>
      <span>{props.generatedAtToken}</span>
    </div>
  );
}
