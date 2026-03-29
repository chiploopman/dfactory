import {
  defineComponent,
  h,
  type PropType,
  type StyleValue,
  type VNodeChild
} from "vue";
import {
  PDF_ONLY_CLASS,
  PDF_PREVIEW_ONLY_CLASS,
  PDF_PRIMITIVE_MARKER_CLASSES,
  PDF_TEMPLATE_TOKEN_VALUES,
  toPdfThemeCssVariables,
  type DeepPartial,
  type PdfTheme
} from "@dfactory/pdf-primitives-core";

type PrimitiveTag = string;

type ClassValue = string | string[] | Record<string, boolean> | undefined;

function normalizeClass(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeClass(entry)).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, boolean>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([name]) => name)
      .join(" ");
  }

  return "";
}

function mergeClassNames(...values: unknown[]): string | undefined {
  const merged = values
    .map((value) => normalizeClass(value))
    .filter(Boolean)
    .join(" ")
    .trim();

  return merged.length > 0 ? merged : undefined;
}

function toComponentName(primitive: string): string {
  const pascal = primitive
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
  return `Df${pascal}`;
}

const primitiveProps = {
  as: {
    type: String,
    required: false
  },
  className: {
    type: String,
    required: false
  },
  style: {
    type: [String, Object, Array] as PropType<StyleValue>,
    required: false
  }
} as const;

function createPrimitiveComponent(
  primitive: string,
  defaultTag = "div",
  baseClass?: string
) {
  return defineComponent({
    name: toComponentName(primitive),
    props: primitiveProps,
    setup(props, { attrs, slots }) {
      return () => {
        const tag = (props.as ?? defaultTag) as PrimitiveTag;
        const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
        return h(
          tag,
          {
            ...restAttrs,
            class: mergeClassNames(baseClass, props.className, attrsClass),
            style: [attrsStyle as StyleValue, props.style],
            "data-df-primitive": primitive
          },
          slots.default?.()
        );
      };
    }
  });
}

export const Document = defineComponent({
  name: "Document",
  props: {
    ...primitiveProps,
    theme: {
      type: Object as PropType<DeepPartial<PdfTheme>>,
      required: false
    }
  },
  setup(props, { attrs, slots }) {
    return () => {
      const tag = (props.as ?? "article") as PrimitiveTag;
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      return h(
        tag,
        {
          ...restAttrs,
          class: mergeClassNames("df-document", props.className, attrsClass),
          style: [toPdfThemeCssVariables(props.theme), attrsStyle as StyleValue, props.style],
          "data-df-primitive": "document"
        },
        slots.default?.()
      );
    };
  }
});

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
  `${PDF_PRIMITIVE_MARKER_CLASSES.avoidBreakInside} ${PDF_PRIMITIVE_MARKER_CLASSES.avoidBreak}`
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

function tokenComponent(name: string, defaultValue: string) {
  return defineComponent({
    name: toComponentName(name),
    props: {
      value: {
        type: String,
        required: false
      },
      className: {
        type: String,
        required: false
      }
    },
    setup(props, { attrs, slots }) {
      return () => {
        const { class: attrsClass, ...restAttrs } = attrs;
        return h(
          "span",
          {
            ...restAttrs,
            class: mergeClassNames("df-token", props.className, attrsClass),
            "data-df-primitive": name
          },
          slots.default?.() ?? props.value ?? defaultValue
        );
      };
    }
  });
}

export const PageNumber = tokenComponent("page-number", PDF_TEMPLATE_TOKEN_VALUES.pageNumber);
export const TotalPages = tokenComponent("total-pages", PDF_TEMPLATE_TOKEN_VALUES.totalPages);
export const PageXofY = tokenComponent(
  "page-x-of-y",
  `${PDF_TEMPLATE_TOKEN_VALUES.pageNumber} / ${PDF_TEMPLATE_TOKEN_VALUES.totalPages}`
);
export const RenderDate = tokenComponent("render-date", PDF_TEMPLATE_TOKEN_VALUES.date);
export const DocumentTitle = tokenComponent("document-title", PDF_TEMPLATE_TOKEN_VALUES.title);
export const TemplateIdToken = tokenComponent("template-id", PDF_TEMPLATE_TOKEN_VALUES.templateId);

export interface TocHeading {
  id: string;
  text: string;
  level?: number;
}

export const TocItem = createPrimitiveComponent("toc-item", "li", "df-toc-item");

export const TableOfContents = defineComponent({
  name: "TableOfContents",
  props: {
    ...primitiveProps,
    title: {
      type: String,
      default: "Table of Contents"
    },
    items: {
      type: Array as PropType<TocHeading[]>,
      required: false
    }
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      const items = props.items;
      const list =
        items && items.length > 0
          ? h(
              "ol",
              { class: "df-toc-list" },
              items.map((item) =>
                h(
                  TocItem,
                  { key: item.id },
                  {
                    default: () => h("a", { href: `#${item.id}` }, item.text)
                  }
                )
              )
            )
          : slots.default?.();

      return h(
        "nav",
        {
          ...restAttrs,
          class: mergeClassNames("df-toc", props.className, attrsClass),
          style: [attrsStyle as StyleValue, props.style],
          "data-df-primitive": "table-of-contents"
        },
        [h("h2", { class: "df-toc-title" }, props.title), list as VNodeChild]
      );
    };
  }
});

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

export const CurrencyText = defineComponent({
  name: "CurrencyText",
  props: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "EUR"
    },
    locale: {
      type: String,
      default: "en-US"
    },
    className: {
      type: String,
      required: false
    }
  },
  setup(props, { attrs }) {
    return () => {
      const { class: attrsClass, ...restAttrs } = attrs;
      const formatted = new Intl.NumberFormat(props.locale, {
        style: "currency",
        currency: props.currency
      }).format(props.amount);
      return h(
        Text,
        {
          ...restAttrs,
          className: mergeClassNames(props.className, attrsClass)
        },
        {
          default: () => formatted
        }
      );
    };
  }
});

export const DateText = defineComponent({
  name: "DateText",
  props: {
    value: {
      type: [String, Date] as PropType<string | Date>,
      required: true
    },
    locale: {
      type: String,
      default: "en-US"
    },
    className: {
      type: String,
      required: false
    }
  },
  setup(props, { attrs }) {
    return () => {
      const { class: attrsClass, ...restAttrs } = attrs;
      const date = props.value instanceof Date ? props.value : new Date(props.value);
      const formatted = Number.isNaN(date.getTime())
        ? String(props.value)
        : date.toLocaleDateString(props.locale);

      return h(
        Text,
        {
          ...restAttrs,
          className: mergeClassNames(props.className, attrsClass)
        },
        {
          default: () => formatted
        }
      );
    };
  }
});

export const Figure = createPrimitiveComponent("figure", "figure", "df-figure");

export const Image = defineComponent({
  name: "Image",
  props: {
    className: {
      type: String,
      required: false
    }
  },
  setup(props, { attrs }) {
    return () => {
      const { class: attrsClass, ...restAttrs } = attrs;
      return h("img", {
        ...restAttrs,
        class: mergeClassNames("df-image", props.className, attrsClass),
        "data-df-primitive": "image"
      });
    };
  }
});

export const Svg = createPrimitiveComponent("svg", "svg", "df-svg");
export const Icon = createPrimitiveComponent("icon", "span", "df-icon");
export const Canvas = createPrimitiveComponent("canvas", "canvas", "df-canvas");

const encodedValueProps = {
  ...primitiveProps,
  value: {
    type: String,
    required: true
  }
} as const;

export const QrCode = defineComponent({
  name: "QrCode",
  props: encodedValueProps,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      return h(
        "span",
        {
          ...restAttrs,
          class: mergeClassNames("df-qrcode", props.className, attrsClass),
          style: [attrsStyle as StyleValue, props.style],
          "data-df-primitive": "qrcode",
          "data-value": props.value
        },
        slots.default?.() ?? props.value
      );
    };
  }
});

export const Barcode = defineComponent({
  name: "Barcode",
  props: encodedValueProps,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      return h(
        "span",
        {
          ...restAttrs,
          class: mergeClassNames("df-barcode", props.className, attrsClass),
          style: [attrsStyle as StyleValue, props.style],
          "data-df-primitive": "barcode",
          "data-value": props.value
        },
        slots.default?.() ?? props.value
      );
    };
  }
});

export const Stamp = createPrimitiveComponent("stamp", "div", "df-stamp");
export const Watermark = createPrimitiveComponent("watermark", "div", "df-watermark");
export const BackgroundLayer = createPrimitiveComponent("background-layer", "div", "df-background-layer");
export const ForegroundLayer = createPrimitiveComponent("foreground-layer", "div", "df-foreground-layer");

export const PdfMetadata = defineComponent({
  name: "PdfMetadata",
  props: {
    title: {
      type: String,
      required: false
    },
    author: {
      type: String,
      required: false
    },
    subject: {
      type: String,
      required: false
    },
    keywords: {
      type: Array as PropType<string[]>,
      required: false
    }
  },
  setup(props) {
    return () =>
      h("span", {
        hidden: true,
        "data-df-primitive": "pdf-metadata",
        "data-metadata": JSON.stringify(props)
      });
  }
});

export const FontFace = defineComponent({
  name: "FontFace",
  props: {
    family: {
      type: String,
      required: true
    },
    src: {
      type: String,
      required: true
    },
    weight: {
      type: String,
      default: "400"
    },
    style: {
      type: String,
      default: "normal"
    }
  },
  setup(props) {
    return () =>
      h(
        "style",
        {
          "data-df-primitive": "font-face"
        },
        `@font-face { font-family: "${props.family}"; src: url("${props.src}"); font-style: ${props.style}; font-weight: ${props.weight}; }`
      );
  }
});

export const FontFamily = defineComponent({
  name: "FontFamily",
  props: {
    ...primitiveProps,
    family: {
      type: String,
      required: true
    }
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { class: attrsClass, style: attrsStyle, ...restAttrs } = attrs;
      return h(
        "span",
        {
          ...restAttrs,
          class: mergeClassNames("df-font-family", props.className, attrsClass),
          style: [attrsStyle as StyleValue, props.style, { fontFamily: props.family }],
          "data-df-primitive": "font-family"
        },
        slots.default?.()
      );
    };
  }
});

export const AssetImage = defineComponent({
  name: "AssetImage",
  props: {
    className: {
      type: String,
      required: false
    }
  },
  setup(props, { attrs }) {
    return () => {
      const { class: attrsClass, ...restAttrs } = attrs;
      return h("img", {
        ...restAttrs,
        class: mergeClassNames("df-asset-image", props.className, attrsClass),
        loading: (restAttrs.loading as string | undefined) ?? "eager",
        "data-df-primitive": "asset-image"
      });
    };
  }
});

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

export type { ClassValue };
