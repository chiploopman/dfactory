import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { APIPage } from "@/components/api-page";

export const mdxComponents: MDXComponents = {
  ...defaultMdxComponents,
  APIPage,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
