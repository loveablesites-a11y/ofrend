# Ofrenda — A Private Memory Garden

Ofrenda is a local-first remembrance app built for the Hacktoberfest 2026 “Ghost in the Machine” challenge. It lets people keep a loved one’s stories, favorite foods, songs, and sayings together in a quiet digital ofrenda. The optional writing helper runs an open-weight model in a browser worker; it does not send the memories to a hosted AI endpoint.

## Run locally

Use Node.js 22.12+ and pnpm 11.25.0:

```sh
pnpm install
pnpm dev
```

Run `pnpm check` for TypeScript diagnostics and `pnpm build` for a static production build in `dist/`.

## How the local AI works

The app uses Hugging Face Transformers.js with `HuggingFaceTB/SmolLM2-360M-Instruct` and its 4-bit ONNX weights. The model is not downloaded until someone chooses **Prepare local writing**. The selected quantized file is approximately 388 MB, so first setup needs a network connection and can take a while. Inference happens in a web worker in the browser. The profile text and generated draft remain in IndexedDB; they are not sent to an app server. Browser-managed caches can be cleared, and the app itself must be available in the browser before it can be used.

The non-AI path works immediately: create, edit, view, and back up memorials without loading the model. Use **Export garden** to download a JSON backup and **Import backup** to add its profiles on another browser or device. Imported records with IDs already in the current garden are skipped rather than overwritten.

## Project structure

- `src/components/` contains the profile form, garden view, and public project/about page.
- `src/ai/` contains the isolated local-inference worker.
- `src/lib/` contains the memorial data model, IndexedDB persistence, image compression, and backup validation.
- `public/manus-routes.json` declares the app's public page routes.
