import { env, pipeline } from "@huggingface/transformers";

const MODEL_ID = "HuggingFaceTB/SmolLM2-360M-Instruct";

type WorkerRequest =
  | { type: "load" }
  | { type: "generate"; requestId: string; personId: string; person: Record<string, unknown> };

type WorkerScope = {
  addEventListener: (type: "message", listener: (event: MessageEvent<WorkerRequest>) => void) => void;
  postMessage: (message: unknown) => void;
};

type TextGenerator = (
  messages: Array<{ role: "system" | "user"; content: string }>,
  options: Record<string, unknown>,
) => Promise<Array<{ generated_text?: string | Array<{ role?: string; content?: string }> }>>;

const workerScope = self as unknown as WorkerScope;
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

let generator: TextGenerator | null = null;
let loading: Promise<TextGenerator> | null = null;

function progressFields(event: unknown): Record<string, unknown> {
  if (!event || typeof event !== "object") return {};
  const details = event as Record<string, unknown>;
  const progress = typeof details.progress === "number" ? details.progress : undefined;
  const loaded = typeof details.loaded === "number" ? details.loaded : undefined;
  const total = typeof details.total === "number" ? details.total : undefined;
  return {
    status: typeof details.status === "string" ? details.status : "progress",
    file: typeof details.file === "string" ? details.file : undefined,
    progress,
    loaded,
    total,
  };
}

async function getGenerator(): Promise<TextGenerator> {
  if (generator) return generator;
  if (!loading) {
    loading = (pipeline("text-generation", MODEL_ID, {
      dtype: "q4",
      progress_callback: (event: unknown) => {
        workerScope.postMessage({ type: "progress", ...progressFields(event) });
      },
    }) as unknown as Promise<TextGenerator>)
      .then((instance) => {
        generator = instance;
        workerScope.postMessage({ type: "ready" });
        return instance;
      })
      .catch((error: unknown) => {
        loading = null;
        throw error;
      });
  }
  return loading;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The local model could not finish that request.";
}

workerScope.addEventListener("message", async (event) => {
  const request = event.data;
  try {
    if (request.type === "load") {
      await getGenerator();
      return;
    }

    const model = await getGenerator();
    const person = request.person;
    const name = String(person.name ?? "the person being remembered");
    const details = [
      `Name: ${name}`,
      person.relationship ? `Relationship: ${String(person.relationship)}` : "",
      person.story ? `A story or description: ${String(person.story)}` : "",
      Array.isArray(person.favoriteFoods) && person.favoriteFoods.length
        ? `Favorite foods: ${(person.favoriteFoods as string[]).join(", ")}`
        : "",
      Array.isArray(person.favoriteSongs) && person.favoriteSongs.length
        ? `Favorite songs: ${(person.favoriteSongs as string[]).join(", ")}`
        : "",
      Array.isArray(person.rememberedWords) && person.rememberedWords.length
        ? `Remembered words or sayings: ${(person.rememberedWords as string[]).join("; ")}`
        : "",
    ].filter(Boolean).join("\n");

    const output = await model(
      [
        {
          role: "system",
          content:
            "You help a person shape their own memories into a gentle remembrance. Use only the facts the user provides. Do not invent events, dates, personality traits, beliefs, relationships, or quotations. Avoid clichés and keep the tone warm, specific, respectful, and grounded. Write two or three short paragraphs. This is a draft for a person to review, not a statement of facts.",
        },
        {
          role: "user",
          content: `Please write a short remembrance of ${name} using only these details. Leave out anything not provided, and do not add new biographical facts.\n\n${details}`,
        },
      ],
      { max_new_tokens: 220, temperature: 0.65, top_p: 0.9, repetition_penalty: 1.08 },
    );

    const generated = output[0]?.generated_text;
    const text =
      typeof generated === "string"
        ? generated
        : Array.isArray(generated)
          ? generated.filter((message) => message.role === "assistant").at(-1)?.content ?? generated.at(-1)?.content ?? ""
          : "";

    if (!text.trim()) throw new Error("The model returned an empty draft. Try again or write one yourself.");
    workerScope.postMessage({ type: "generated", requestId: request.requestId, personId: request.personId, text: text.trim() });
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message: errorMessage(error),
      ...(request.type === "generate" ? { requestId: request.requestId, personId: request.personId } : {}),
    });
  }
});
