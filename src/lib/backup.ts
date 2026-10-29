import type { Memorial } from "./types";

const BACKUP_FORMAT = "ofrenda-memory-garden";
const BACKUP_VERSION = 1;

export function createBackup(memorials: Memorial[]): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      memorials,
    },
    null,
    2,
  );
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 100)
    : [];
}

export function parseBackup(input: unknown): Memorial[] {
  if (!input || typeof input !== "object") {
    throw new Error("That file is not an Ofrenda garden backup.");
  }

  const backup = input as Record<string, unknown>;
  if (
    backup.format !== BACKUP_FORMAT ||
    backup.version !== BACKUP_VERSION ||
    !Array.isArray(backup.memorials)
  ) {
    throw new Error("This backup format is not recognized or is not supported.");
  }
  if (backup.memorials.length > 100) {
    throw new Error("A backup can contain up to 100 memorials at a time.");
  }

  return backup.memorials.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Memorial ${index + 1} could not be read.`);
    }
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.name !== "string" || !item.name.trim()) {
      throw new Error(`Memorial ${index + 1} is missing its name or ID.`);
    }
    const photo =
      typeof item.photo === "string" && item.photo.startsWith("data:image/") && item.photo.length < 12_000_000
        ? item.photo
        : undefined;
    const now = new Date().toISOString();

    return {
      id: item.id.slice(0, 100),
      name: item.name.slice(0, 120),
      relationship: typeof item.relationship === "string" ? item.relationship.slice(0, 120) : "",
      birthYear: typeof item.birthYear === "string" ? item.birthYear.slice(0, 12) : "",
      passingYear: typeof item.passingYear === "string" ? item.passingYear.slice(0, 12) : "",
      story: typeof item.story === "string" ? item.story.slice(0, 12_000) : "",
      favoriteFoods: strings(item.favoriteFoods),
      favoriteSongs: strings(item.favoriteSongs),
      rememberedWords: strings(item.rememberedWords),
      remembrance: typeof item.remembrance === "string" ? item.remembrance.slice(0, 12_000) : "",
      photo,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : now,
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : now,
    } satisfies Memorial;
  });
}
