# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Published vault content

Portal development and standalone builds run `npm run sync` first. That delegates to the Threshold repository's existing `build:data` pipeline, which exports Markdown from the configured `_publish` directory into `../data/threshold-vault.json`; it does not copy the entire Obsidian vault. The Portal statically imports the exported chamber records at build time, then renders each published document's Markdown `body` with `react-markdown`; the Archive makes no runtime vault-data request.

The root Threshold production build runs `build:data` once, then calls this package's `build:site` to avoid syncing twice. Root Pages development likewise exports and builds the Portal before starting Wrangler. CI's static build uses the committed public export and does not access the source vault.

See the [Obsidian Markdown pipeline guide](docs/OBSIDIAN-MARKDOWN-PIPELINE.md) for the data flow, generated outputs, publishing boundaries, and commands.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
