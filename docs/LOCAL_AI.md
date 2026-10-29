# Local model implementation notes

Ofrenda uses the `@huggingface/transformers` package to run inference in the browser. The official Transformers.js documentation describes in-browser model execution through ONNX Runtime, with CPU/WASM as the default and WebGPU available as an optional device. The official project tutorial places inference code in a Web Worker so model loading and generation do not block the interface, and forwards the pipeline's progress callback to the UI.

The selected model is `HuggingFaceTB/SmolLM2-360M-Instruct`. Its model card documents direct use with Transformers.js text-generation pipelines and includes ONNX variants. The local app requests the 4-bit `q4` variant, whose repository file size is about 388 MB. The model card describes the model as primarily English and warns that its output may be inaccurate or inconsistent. The UI therefore treats the result as a draft, asks the model not to invent details, and requires the person using the app to review and save it.

Personal profiles and photos are stored in browser IndexedDB. Only model assets are fetched from the model host when the person explicitly opts in. Memorial text is passed to the local worker and is not posted to a remote inference endpoint. Browser cache and local site data can be removed by the user or the browser; a backup export is the portable way to preserve a garden.

## Sources

- [Transformers.js documentation](https://huggingface.co/docs/transformers.js/en/index)
- [Official Transformers.js browser-worker tutorial](https://github.com/huggingface/transformers.js/blob/main/packages/transformers/docs/source/tutorials/next.md)
- [SmolLM2-360M-Instruct model card](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)
