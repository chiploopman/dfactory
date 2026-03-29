export type PdfPrimitiveMarkerName =
  | "pageBreakBefore"
  | "pageBreakAfter"
  | "keepWithNext"
  | "keepTogether"
  | "avoidBreak"
  | "avoidBreakInside"
  | "startOnLeftPage"
  | "startOnRightPage"
  | "startOnRecto"
  | "startOnVerso"
  | "pageGroup";

export const PDF_PRIMITIVE_MARKER_CLASSES: Record<PdfPrimitiveMarkerName, string> = {
  pageBreakBefore: "df-page-break-before",
  pageBreakAfter: "df-page-break-after",
  keepWithNext: "df-keep-with-next",
  keepTogether: "df-keep-together",
  avoidBreak: "df-avoid-break",
  avoidBreakInside: "df-avoid-break-inside",
  startOnLeftPage: "df-start-on-left-page",
  startOnRightPage: "df-start-on-right-page",
  startOnRecto: "df-start-on-recto",
  startOnVerso: "df-start-on-verso",
  pageGroup: "df-page-group"
};

export const PDF_LEGACY_MARKER_CLASS_ALIASES: Record<string, string> = {
  "df-avoid-break-inside": "df-avoid-break"
};

export const PDF_PAGED_MEDIA_ONLY_MARKERS: PdfPrimitiveMarkerName[] = [
  "startOnLeftPage",
  "startOnRightPage",
  "startOnRecto",
  "startOnVerso",
  "pageGroup"
];

export function getPdfPrimitiveMarkerClass(name: PdfPrimitiveMarkerName): string {
  return PDF_PRIMITIVE_MARKER_CLASSES[name];
}

export const PDF_PREVIEW_ONLY_CLASS = "df-preview-only";
export const PDF_ONLY_CLASS = "df-pdf-only";

export const PDF_TEMPLATE_TOKEN_VALUES = {
  pageNumber: "{{pageNumber}}",
  totalPages: "{{totalPages}}",
  pageXofY: "{{pageXofY}}",
  date: "{{date}}",
  title: "{{title}}",
  templateId: "{{templateId}}"
} as const;

export type PdfTemplateTokenName = keyof typeof PDF_TEMPLATE_TOKEN_VALUES;

export interface PdfTemplateTokenReplacements {
  pageNumber?: string;
  totalPages?: string;
  pageXofY?: string;
  date?: string;
  title?: string;
  templateId?: string;
}

export function applyPdfTemplateTokens(
  template: string,
  replacements: PdfTemplateTokenReplacements
): string {
  const resolved = {
    [PDF_TEMPLATE_TOKEN_VALUES.pageNumber]: replacements.pageNumber ?? PDF_TEMPLATE_TOKEN_VALUES.pageNumber,
    [PDF_TEMPLATE_TOKEN_VALUES.totalPages]: replacements.totalPages ?? PDF_TEMPLATE_TOKEN_VALUES.totalPages,
    [PDF_TEMPLATE_TOKEN_VALUES.pageXofY]:
      replacements.pageXofY ??
      `${replacements.pageNumber ?? PDF_TEMPLATE_TOKEN_VALUES.pageNumber} / ${replacements.totalPages ?? PDF_TEMPLATE_TOKEN_VALUES.totalPages}`,
    [PDF_TEMPLATE_TOKEN_VALUES.date]: replacements.date ?? PDF_TEMPLATE_TOKEN_VALUES.date,
    [PDF_TEMPLATE_TOKEN_VALUES.title]: replacements.title ?? PDF_TEMPLATE_TOKEN_VALUES.title,
    [PDF_TEMPLATE_TOKEN_VALUES.templateId]: replacements.templateId ?? PDF_TEMPLATE_TOKEN_VALUES.templateId
  };

  let output = template;
  for (const [token, value] of Object.entries(resolved)) {
    output = output.replaceAll(token, value);
  }

  return output;
}

export interface PdfTheme {
  font: {
    family: string;
    monoFamily: string;
    size: string;
    lineHeight: string;
  };
  space: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  color: {
    text: string;
    muted: string;
    border: string;
    surface: string;
    surfaceAlt: string;
    accent: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  border: {
    width: string;
    style: string;
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

export const DEFAULT_PDF_THEME: PdfTheme = {
  font: {
    family: "Inter, 'Segoe UI', Arial, sans-serif",
    monoFamily: "'Fira Code', 'JetBrains Mono', Menlo, monospace",
    size: "12px",
    lineHeight: "1.55"
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px"
  },
  color: {
    text: "#0f172a",
    muted: "#475569",
    border: "#e2e8f0",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    accent: "#1d4ed8"
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px"
  },
  border: {
    width: "1px",
    style: "solid"
  }
};

function mergeThemeSection<T extends Record<string, string>>(
  defaults: T,
  override: DeepPartial<T> | undefined
): T {
  return {
    ...defaults,
    ...(override ?? {})
  } as T;
}

export function resolvePdfTheme(theme?: DeepPartial<PdfTheme>): PdfTheme {
  return {
    font: mergeThemeSection(DEFAULT_PDF_THEME.font, theme?.font),
    space: mergeThemeSection(DEFAULT_PDF_THEME.space, theme?.space),
    color: mergeThemeSection(DEFAULT_PDF_THEME.color, theme?.color),
    radius: mergeThemeSection(DEFAULT_PDF_THEME.radius, theme?.radius),
    border: mergeThemeSection(DEFAULT_PDF_THEME.border, theme?.border)
  };
}

export function toPdfThemeCssVariables(theme?: DeepPartial<PdfTheme>): Record<string, string> {
  const resolved = resolvePdfTheme(theme);
  return {
    "--df-pdf-font-family": resolved.font.family,
    "--df-pdf-font-mono-family": resolved.font.monoFamily,
    "--df-pdf-font-size": resolved.font.size,
    "--df-pdf-line-height": resolved.font.lineHeight,
    "--df-pdf-space-xs": resolved.space.xs,
    "--df-pdf-space-sm": resolved.space.sm,
    "--df-pdf-space-md": resolved.space.md,
    "--df-pdf-space-lg": resolved.space.lg,
    "--df-pdf-space-xl": resolved.space.xl,
    "--df-pdf-color-text": resolved.color.text,
    "--df-pdf-color-muted": resolved.color.muted,
    "--df-pdf-color-border": resolved.color.border,
    "--df-pdf-color-surface": resolved.color.surface,
    "--df-pdf-color-surface-alt": resolved.color.surfaceAlt,
    "--df-pdf-color-accent": resolved.color.accent,
    "--df-pdf-radius-sm": resolved.radius.sm,
    "--df-pdf-radius-md": resolved.radius.md,
    "--df-pdf-radius-lg": resolved.radius.lg,
    "--df-pdf-border-width": resolved.border.width,
    "--df-pdf-border-style": resolved.border.style
  };
}

export function stringifyPdfThemeCssVariables(theme?: DeepPartial<PdfTheme>): string {
  const variables = toPdfThemeCssVariables(theme);
  return Object.entries(variables)
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");
}
