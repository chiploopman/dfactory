import * as React from "react";
import {
  PDF_ONLY_CLASS,
  PDF_PREVIEW_ONLY_CLASS,
  PDF_PRIMITIVE_MARKER_CLASSES,
  PDF_TEMPLATE_TOKEN_VALUES,
  toPdfThemeCssVariables,
  type DeepPartial,
  type PdfTheme
} from "@dfactory/pdf-primitives-core";

type CssWithVars = React.CSSProperties & Record<`--${string}`, string | number>;

type PrimitiveTag = keyof React.JSX.IntrinsicElements;

type PrimitiveProps = React.HTMLAttributes<HTMLElement> & {
  as?: PrimitiveTag;
};

function cx(...values: Array<string | undefined | false | null>): string | undefined {
  const normalized = values.filter((value): value is string => Boolean(value));
  return normalized.length > 0 ? normalized.join(" ") : undefined;
}

function createPrimitiveComponent(
  primitive: string,
  defaultTag: PrimitiveTag = "div",
  baseClass?: string
): React.FC<PrimitiveProps> {
  const PrimitiveComponent: React.FC<PrimitiveProps> = ({
    as,
    className,
    children,
    ...rest
  }) => {
    const Tag = (as ?? defaultTag) as PrimitiveTag;
    return React.createElement(
      Tag,
      {
        ...rest,
        className: cx(baseClass, className),
        "data-df-primitive": primitive
      },
      children
    );
  };

  PrimitiveComponent.displayName = primitive;
  return PrimitiveComponent;
}

export interface DocumentProps extends PrimitiveProps {
  theme?: DeepPartial<PdfTheme>;
}

export const Document: React.FC<DocumentProps> = ({
  as,
  className,
  style,
  theme,
  children,
  ...rest
}) => {
  const Tag = (as ?? "article") as PrimitiveTag;
  const themeVars = toPdfThemeCssVariables(theme);
  const mergedStyle: CssWithVars = {
    ...themeVars,
    ...(style ?? {})
  };

  return React.createElement(
    Tag,
    {
      ...rest,
      className: cx("df-document", className),
      style: mergedStyle,
      "data-df-primitive": "document"
    },
    children
  );
};

export const Page = createPrimitiveComponent("page", "section", "df-page");
export const PageSetup = createPrimitiveComponent("page-setup", "div", "df-page-setup");
export const Section = createPrimitiveComponent("section", "section", "df-section");
export const Block = createPrimitiveComponent("block", "div", "df-block");
export const Inline = createPrimitiveComponent("inline", "span", "df-inline");
export const Stack = createPrimitiveComponent("stack", "div", "df-stack");
export const Row = createPrimitiveComponent("row", "div", "df-row");
export const Columns = createPrimitiveComponent("columns", "div", "df-columns");
export const Column = createPrimitiveComponent("column", "div", "df-column");
export const Grid = createPrimitiveComponent("grid", "div", "df-grid");
export const GridItem = createPrimitiveComponent("grid-item", "div", "df-grid-item");
export const Spacer = createPrimitiveComponent("spacer", "div", "df-spacer");
export const Divider = createPrimitiveComponent("divider", "hr", "df-divider");

export const PageBreak = createPrimitiveComponent(
  "page-break",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.pageBreakBefore
);
export const PageBreakBefore = createPrimitiveComponent(
  "page-break-before",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.pageBreakBefore
);
export const PageBreakAfter = createPrimitiveComponent(
  "page-break-after",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.pageBreakAfter
);
export const KeepTogether = createPrimitiveComponent(
  "keep-together",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.keepTogether
);
export const KeepWithNext = createPrimitiveComponent(
  "keep-with-next",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.keepWithNext
);
export const AvoidBreakInside = createPrimitiveComponent(
  "avoid-break-inside",
  "div",
  cx(PDF_PRIMITIVE_MARKER_CLASSES.avoidBreakInside, PDF_PRIMITIVE_MARKER_CLASSES.avoidBreak)
);
export const StartOnLeftPage = createPrimitiveComponent(
  "start-on-left-page",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.startOnLeftPage
);
export const StartOnRightPage = createPrimitiveComponent(
  "start-on-right-page",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.startOnRightPage
);
export const StartOnRecto = createPrimitiveComponent(
  "start-on-recto",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.startOnRecto
);
export const StartOnVerso = createPrimitiveComponent(
  "start-on-verso",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.startOnVerso
);
export const PageGroup = createPrimitiveComponent(
  "page-group",
  "div",
  PDF_PRIMITIVE_MARKER_CLASSES.pageGroup
);

export const RunningHeader = createPrimitiveComponent("running-header", "div", "df-running-header");
export const RunningFooter = createPrimitiveComponent("running-footer", "div", "df-running-footer");
export const RunningTopLeft = createPrimitiveComponent("running-top-left", "div", "df-running-top-left");
export const RunningTopCenter = createPrimitiveComponent(
  "running-top-center",
  "div",
  "df-running-top-center"
);
export const RunningTopRight = createPrimitiveComponent("running-top-right", "div", "df-running-top-right");
export const RunningBottomLeft = createPrimitiveComponent(
  "running-bottom-left",
  "div",
  "df-running-bottom-left"
);
export const RunningBottomCenter = createPrimitiveComponent(
  "running-bottom-center",
  "div",
  "df-running-bottom-center"
);
export const RunningBottomRight = createPrimitiveComponent(
  "running-bottom-right",
  "div",
  "df-running-bottom-right"
);

interface TokenProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string;
}

function Token({ value, children, className, ...rest }: TokenProps): React.ReactElement {
  return (
    <span {...rest} className={cx("df-token", className)}>
      {children ?? value}
    </span>
  );
}

export function PageNumber(props: TokenProps): React.ReactElement {
  return <Token {...props} value={props.value ?? PDF_TEMPLATE_TOKEN_VALUES.pageNumber} />;
}

export function TotalPages(props: TokenProps): React.ReactElement {
  return <Token {...props} value={props.value ?? PDF_TEMPLATE_TOKEN_VALUES.totalPages} />;
}

export function PageXofY(props: TokenProps): React.ReactElement {
  return (
    <Token
      {...props}
      value={
        props.value ??
        `${PDF_TEMPLATE_TOKEN_VALUES.pageNumber} / ${PDF_TEMPLATE_TOKEN_VALUES.totalPages}`
      }
    />
  );
}

export function RenderDate(props: TokenProps): React.ReactElement {
  return <Token {...props} value={props.value ?? PDF_TEMPLATE_TOKEN_VALUES.date} />;
}

export function DocumentTitle(props: TokenProps): React.ReactElement {
  return <Token {...props} value={props.value ?? PDF_TEMPLATE_TOKEN_VALUES.title} />;
}

export function TemplateIdToken(props: TokenProps): React.ReactElement {
  return <Token {...props} value={props.value ?? PDF_TEMPLATE_TOKEN_VALUES.templateId} />;
}

export interface TocHeading {
  id: string;
  text: string;
  level?: number;
}

export interface TableOfContentsProps extends PrimitiveProps {
  title?: string;
  items?: TocHeading[];
}

export const TocItem = createPrimitiveComponent("toc-item", "li", "df-toc-item");

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  title = "Table of Contents",
  items,
  className,
  children,
  ...rest
}) => {
  return (
    <nav {...rest} className={cx("df-toc", className)} data-df-primitive="table-of-contents">
      <h2 className="df-toc-title">{title}</h2>
      {items && items.length > 0 ? (
        <ol className="df-toc-list">
          {items.map((item) => (
            <TocItem key={item.id}>
              <a href={`#${item.id}`}>{item.text}</a>
            </TocItem>
          ))}
        </ol>
      ) : (
        children
      )}
    </nav>
  );
};

export const Bookmark = createPrimitiveComponent("bookmark", "span", "df-bookmark");
export const BookmarkGroup = createPrimitiveComponent("bookmark-group", "div", "df-bookmark-group");
export const Anchor = createPrimitiveComponent("anchor", "span", "df-anchor");
export const Link = createPrimitiveComponent("link", "a", "df-link");
export const CrossRefPage = createPrimitiveComponent("crossref-page", "span", "df-crossref-page");
export const CrossRefText = createPrimitiveComponent("crossref-text", "span", "df-crossref-text");

export const Heading = createPrimitiveComponent("heading", "h2", "df-heading");
export const Paragraph = createPrimitiveComponent("paragraph", "p", "df-paragraph");
export const Text = createPrimitiveComponent("text", "span", "df-text");
export const Small = createPrimitiveComponent("small", "small", "df-small");
export const Lead = createPrimitiveComponent("lead", "p", "df-lead");
export const Caption = createPrimitiveComponent("caption", "figcaption", "df-caption");
export const Quote = createPrimitiveComponent("quote", "blockquote", "df-quote");
export const CodeInline = createPrimitiveComponent("code-inline", "code", "df-code-inline");
export const List = createPrimitiveComponent("list", "ul", "df-list");
export const ListItem = createPrimitiveComponent("list-item", "li", "df-list-item");
export const DefinitionList = createPrimitiveComponent("definition-list", "dl", "df-definition-list");
export const DefinitionTerm = createPrimitiveComponent("definition-term", "dt", "df-definition-term");
export const DefinitionValue = createPrimitiveComponent(
  "definition-value",
  "dd",
  "df-definition-value"
);

export const Table = createPrimitiveComponent("table", "table", "df-table");
export const TableHead = createPrimitiveComponent("table-head", "thead", "df-table-head");
export const TableBody = createPrimitiveComponent("table-body", "tbody", "df-table-body");
export const TableFoot = createPrimitiveComponent("table-foot", "tfoot", "df-table-foot");
export const TableRow = createPrimitiveComponent("table-row", "tr", "df-table-row");
export const TableHeaderCell = createPrimitiveComponent("table-header-cell", "th", "df-table-header-cell");
export const TableCell = createPrimitiveComponent("table-cell", "td", "df-table-cell");
export const NumericCell = createPrimitiveComponent("numeric-cell", "td", "df-table-cell df-table-cell-numeric");

export interface CurrencyTextProps extends TokenProps {
  amount: number;
  currency?: string;
  locale?: string;
}

export function CurrencyText({ amount, currency = "EUR", locale = "en-US", ...rest }: CurrencyTextProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(amount);

  return <Text {...rest}>{formatted}</Text>;
}

export interface DateTextProps extends Omit<TokenProps, "value"> {
  value: string | Date;
  locale?: string;
}

export function DateText({ value, locale = "en-US", ...rest }: DateTextProps) {
  const date = value instanceof Date ? value : new Date(value);
  const formatted = Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(locale);
  return <Text {...rest}>{formatted}</Text>;
}

export const Figure = createPrimitiveComponent("figure", "figure", "df-figure");

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function Image({ className, ...rest }: ImageProps): React.ReactElement {
  return <img {...rest} className={cx("df-image", className)} data-df-primitive="image" />;
}

export const Svg = createPrimitiveComponent("svg", "svg", "df-svg");
export const Icon = createPrimitiveComponent("icon", "span", "df-icon");
export const Canvas = createPrimitiveComponent("canvas", "canvas", "df-canvas");

export interface EncodedValueProps extends PrimitiveProps {
  value: string;
}

export const QrCode: React.FC<EncodedValueProps> = ({ value, className, ...rest }) => (
  <span
    {...rest}
    className={cx("df-qrcode", className)}
    data-df-primitive="qrcode"
    data-value={value}
  >
    {value}
  </span>
);

export const Barcode: React.FC<EncodedValueProps> = ({ value, className, ...rest }) => (
  <span
    {...rest}
    className={cx("df-barcode", className)}
    data-df-primitive="barcode"
    data-value={value}
  >
    {value}
  </span>
);

export const Stamp = createPrimitiveComponent("stamp", "div", "df-stamp");
export const Watermark = createPrimitiveComponent("watermark", "div", "df-watermark");
export const BackgroundLayer = createPrimitiveComponent("background-layer", "div", "df-background-layer");
export const ForegroundLayer = createPrimitiveComponent("foreground-layer", "div", "df-foreground-layer");

export interface PdfMetadataProps {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

export const PdfMetadata: React.FC<PdfMetadataProps> = (props) => {
  const payload = JSON.stringify(props);
  return <span data-df-primitive="pdf-metadata" data-metadata={payload} hidden />;
};

export interface FontFaceProps {
  family: string;
  src: string;
  weight?: string;
  style?: string;
}

export const FontFace: React.FC<FontFaceProps> = ({
  family,
  src,
  weight = "400",
  style = "normal"
}) => {
  return (
    <style data-df-primitive="font-face">
      {`@font-face { font-family: "${family}"; src: url("${src}"); font-style: ${style}; font-weight: ${weight}; }`}
    </style>
  );
};

export interface FontFamilyProps extends PrimitiveProps {
  family: string;
}

export const FontFamily: React.FC<FontFamilyProps> = ({
  family,
  style,
  className,
  children,
  ...rest
}) => {
  return (
    <span
      {...rest}
      className={cx("df-font-family", className)}
      style={{ ...(style ?? {}), fontFamily: family }}
      data-df-primitive="font-family"
    >
      {children}
    </span>
  );
};

export const AssetImage: React.FC<ImageProps> = ({ className, ...rest }) => (
  <img
    {...rest}
    className={cx("df-asset-image", className)}
    data-df-primitive="asset-image"
    loading={rest.loading ?? "eager"}
  />
);

export const AssetPolicyBoundary = createPrimitiveComponent(
  "asset-policy-boundary",
  "div",
  "df-asset-policy-boundary"
);

export const DebugBounds = createPrimitiveComponent("debug-bounds", "div", "df-debug-bounds");
export const DebugFlow = createPrimitiveComponent("debug-flow", "div", "df-debug-flow");
export const OverflowGuard = createPrimitiveComponent("overflow-guard", "div", "df-overflow-guard");
export const OrphanWidowGuard = createPrimitiveComponent(
  "orphan-widow-guard",
  "div",
  "df-orphan-widow-guard"
);

export const PreviewOnly = createPrimitiveComponent("preview-only", "div", PDF_PREVIEW_ONLY_CLASS);
export const PdfOnly = createPrimitiveComponent("pdf-only", "div", PDF_ONLY_CLASS);
