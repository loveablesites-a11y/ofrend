import { createStore, get, set } from "idb-keyval";
import type { Memorial } from "./types";

const gardenStore = createStore("ofrenda-memory-garden", "private-memorials");
const GARDEN_KEY = "memorials";

export async function readMemorials(): Promise<Memorial[]> {
  const saved = await get<unknown>(GARDEN_KEY, gardenStore);
  return Array.isArray(saved) ? (saved as Memorial[]) : [];
}

export async function writeMemorials(memorials: Memorial[]): Promise<void> {
  await set(GARDEN_KEY, memorials, gardenStore);
}
