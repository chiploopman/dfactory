import type {
  PdfTemplateConfig,
  TemplateExample,
  TemplateMeta,
  TemplateModule,
  TemplateRenderContext
} from "@dfactory/core";
import type { ZodTypeAny, infer as InferZod } from "zod";

type TemplateMetaInput = Omit<TemplateMeta, "id"> & { id?: string };

export interface DefineTemplateInput<TSchema extends ZodTypeAny, TPayload> {
  meta: TemplateMetaInput;
  schema: TSchema;
  render: (
    payload: TPayload,
    context?: TemplateRenderContext
  ) => unknown | Promise<unknown>;
  pdf?: PdfTemplateConfig;
  examples?: TemplateExample<TPayload>[];
}

export type InferTemplatePayload<TSchema extends ZodTypeAny> = InferZod<TSchema>;

export type DefinedTemplate<
  TSchema extends ZodTypeAny,
  TPayload = InferTemplatePayload<TSchema>
> = TemplateModule<TPayload> & {
  schema: TSchema;
  meta: TemplateMetaInput;
};

export function defineTemplate<
  TSchema extends ZodTypeAny,
  TPayload = InferTemplatePayload<TSchema>
>(input: DefineTemplateInput<TSchema, TPayload>): DefinedTemplate<TSchema, TPayload> {
  return input as DefinedTemplate<TSchema, TPayload>;
}
