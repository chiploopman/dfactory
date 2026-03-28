import type { TemplateTocHeading } from "@dfactory/core";

export function InvoiceReferenceToc(props: {
  title: string;
  headings: TemplateTocHeading[];
}) {
  return (
    <nav
      aria-label={props.title}
      style={{
        marginBottom: "24px",
        padding: "14px 16px",
        borderRadius: "10px",
        border: "1px solid rgba(79, 70, 229, 0.18)",
        background: "rgba(79, 70, 229, 0.04)"
      }}
    >
      <h2 style={{ margin: 0, fontSize: "16px", color: "#312e81" }}>{props.title}</h2>
      <ol style={{ margin: "10px 0 0", paddingLeft: "18px" }}>
        {props.headings.map((heading) => (
          <li key={heading.id} style={{ marginTop: "4px", marginLeft: `${(heading.level - 1) * 10}px` }}>
            <a href={`#${heading.id}`} style={{ color: "#1e293b", textDecoration: "none" }}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
