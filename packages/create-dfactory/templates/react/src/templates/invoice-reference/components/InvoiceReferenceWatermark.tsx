export function InvoiceReferenceWatermark(props: { text: string }) {
  return (
    <div
      style={{
        transform: "rotate(-24deg)",
        fontSize: "52px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "rgba(79, 70, 229, 0.14)",
        textTransform: "uppercase"
      }}
    >
      {props.text}
    </div>
  );
}
