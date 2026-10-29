export interface Memorial {
  id: string;
  name: string;
  relationship: string;
  birthYear: string;
  passingYear: string;
  story: string;
  favoriteFoods: string[];
  favoriteSongs: string[];
  rememberedWords: string[];
  remembrance: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ModelState =
  | "not-downloaded"
  | "downloading"
  | "ready"
  | "generating"
  | "completed"
  | "error";

export interface ModelProgress {
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}
