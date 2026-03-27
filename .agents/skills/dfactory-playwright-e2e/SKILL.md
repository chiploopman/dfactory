# Skill: dfactory-playwright-e2e

## Purpose
Keep DFactory end-to-end tests stable and focused on business-critical UX.

## Scenarios
1. Catalog lists and switches templates.
2. Payload editor updates preview/generate requests.
3. HTML preview renders in iframe.
4. PDF preview/generate paths are executable.
5. Source tab and API playground respect production visibility flags.

## Stability rules
1. Prefer `data-testid` selectors for high-value interactions.
2. Use role selectors for button/tab actions where labels are stable.
3. Avoid brittle timing assertions; wait on visible state changes.
