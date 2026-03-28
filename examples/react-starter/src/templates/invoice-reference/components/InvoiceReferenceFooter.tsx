export function InvoiceReferenceFooter(props: {
  templateId: string;
  pageNumberToken: string;
  totalPagesToken: string;
  supportEmail?: string;
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
      <span>{props.supportEmail ?? "billing@dfactory.dev"}</span>
      <span>{props.templateId}</span>
      <span>
        {props.pageNumberToken} / {props.totalPagesToken}
      </span>
    </div>
  );
}
