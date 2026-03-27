# Skill: shadcn-ui-workflow

## Purpose
Ensure UI implementation follows shadcn principles and avoids reinventing existing building blocks.

## Rules
1. Prefer shadcn-style primitives in `packages/ui/src/components/ui` for buttons, inputs, tabs, cards, badges, separators, and scroll areas.
2. Do not introduce custom versions of components if equivalent shadcn primitives already exist.
3. Keep styles token-driven (`--background`, `--foreground`, etc.) and composed with Tailwind utility classes.
4. Maintain responsive and keyboard-accessible behavior in catalog and panel interactions.

## Required checks
1. `pnpm --filter @dfactory/ui typecheck`
2. `pnpm test:e2e`
