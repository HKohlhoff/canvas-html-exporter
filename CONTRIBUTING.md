# Contributing

## Development setup

```bash
npm ci
npm test
npm run lint
npm run build:prod
```

For local Obsidian testing, set `OBSIDIAN_PLUGINS_DIR` to the parent directory
that contains vault plugins and run:

```bash
npm run build:prod:deploy
```

## Project structure

- `src/export/` handles normalized Canvas data, export orchestration and files.
- `src/render/` generates Markdown/HTML and the embedded browser runtime.
- `src/helpers/` contains focused path, link, color and preview helpers.
- `tests/` contains automated unit and integration tests.
- `manual-tests/` documents realistic Obsidian and browser checks.
- `examples/demo-vault/` is the public demonstration vault.

## Expectations

- Preserve existing package and single-HTML behavior unless a change is
  explicitly intended.
- Keep TypeScript strict and avoid unnecessary `any`.
- Prefer Obsidian APIs for vault data; isolate desktop filesystem access.
- Keep settings backward-compatible through normalization and migration.
- Add focused tests for non-trivial behavior and regressions.
- Keep the plugin local and privacy-preserving.
- Update `CHANGELOG.md`, README and release documentation when user-facing
  behavior changes.

Feature development should use a `feature/*` branch. Run the full quality gate
before requesting a merge into `master`. Do not prepare or publish a release
from an unreviewed feature branch.
