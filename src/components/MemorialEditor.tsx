import { useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { compressPhoto } from "../lib/photos";
import type { Memorial } from "../lib/types";

interface MemorialEditorProps {
  initial?: Memorial;
  onCancel: () => void;
  onSave: (memorial: Memorial) => Promise<void>;
}

type Draft = {
  name: string;
  relationship: string;
  birthYear: string;
  passingYear: string;
  story: string;
  favoriteFoods: string;
  favoriteSongs: string;
  rememberedWords: string;
  remembrance: string;
};

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

export default function MemorialEditor({ initial, onCancel, onSave }: MemorialEditorProps) {
  const [draft, setDraft] = useState<Draft>({
    name: initial?.name ?? "",
    relationship: initial?.relationship ?? "",
    birthYear: initial?.birthYear ?? "",
    passingYear: initial?.passingYear ?? "",
    story: initial?.story ?? "",
    favoriteFoods: initial?.favoriteFoods.join("\n") ?? "",
    favoriteSongs: initial?.favoriteSongs.join("\n") ?? "",
    rememberedWords: initial?.rememberedWords.join("\n") ?? "",
    remembrance: initial?.remembrance ?? "",
  });
  const [photo, setPhoto] = useState(initial?.photo);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function choosePhoto(file?: File) {
    if (!file) return;
    setError("");
    setPhotoBusy(true);
    try {
      setPhoto(await compressPhoto(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This photo could not be prepared.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Add a name before saving this memorial.");
      return;
    }
    setSaving(true);
    setError("");
    const now = new Date().toISOString();
    const memorial: Memorial = {
      id: initial?.id ?? crypto.randomUUID(),
      name: draft.name.trim(),
      relationship: draft.relationship.trim(),
      birthYear: draft.birthYear.trim(),
      passingYear: draft.passingYear.trim(),
      story: draft.story.trim(),
      favoriteFoods: lines(draft.favoriteFoods),
      favoriteSongs: lines(draft.favoriteSongs),
      rememberedWords: lines(draft.rememberedWords),
      remembrance: draft.remembrance.trim(),
      photo,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await onSave(memorial);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The memorial could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="memorial-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header className="dialog-head">
          <div>
            <p className="eyebrow">A PLACE IN YOUR GARDEN</p>
            <h2 id="editor-title">{initial ? "Tend this memory" : "Make a place for someone"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close editor"><X size={20} /></button>
        </header>

        <form onSubmit={submit} className="memorial-form">
          <div className="form-photo-row">
            <div className="form-photo-preview">
              {photo ? <img src={photo} alt="Selected portrait preview" /> : <ImagePlus size={23} />}
            </div>
            <div className="form-photo-copy">
              <strong>A familiar face</strong>
              <span>Optional. Your photo stays in this browser.</span>
              <div className="photo-actions">
                <label className="button button-small button-outline" htmlFor="portrait-file">
                  {photoBusy ? <LoaderCircle className="spin" size={15} /> : <ImagePlus size={15} />}
                  {photoBusy ? "Preparing…" : photo ? "Choose another" : "Add a photo"}
                </label>
                {photo && <button className="text-button" type="button" onClick={() => setPhoto(undefined)}>Remove</button>}
              </div>
              <input
                className="visually-hidden"
                id="portrait-file"
                type="file"
                accept="image/*"
                onChange={(event) => void choosePhoto(event.currentTarget.files?.[0])}
              />
            </div>
          </div>

          <div className="form-grid">
            <label className="field field-full">
              <span>Their name <i>required</i></span>
              <input autoFocus value={draft.name} maxLength={120} onChange={(event) => update("name", event.target.value)} placeholder="The name you called them" required />
            </label>
            <label className="field">
              <span>Who they were to you</span>
              <input value={draft.relationship} maxLength={120} onChange={(event) => update("relationship", event.target.value)} placeholder="Grandmother, friend, mentor…" />
            </label>
            <div className="field">
              <span>The years they were here</span>
              <div className="year-fields">
                <input aria-label="Birth year" inputMode="numeric" maxLength={12} value={draft.birthYear} onChange={(event) => update("birthYear", event.target.value)} placeholder="Born" />
                <span aria-hidden="true">—</span>
                <input aria-label="Passing year" inputMode="numeric" maxLength={12} value={draft.passingYear} onChange={(event) => update("passingYear", event.target.value)} placeholder="Remembered" />
              </div>
            </div>
            <label className="field field-full">
              <span>A story or a small detail</span>
              <textarea rows={4} maxLength={12000} value={draft.story} onChange={(event) => update("story", event.target.value)} placeholder="A way they laughed. The garden they kept. A day you still return to." />
            </label>
            <label className="field">
              <span>At their table</span>
              <textarea rows={3} value={draft.favoriteFoods} onChange={(event) => update("favoriteFoods", event.target.value)} placeholder="Favorite foods, one per line" />
            </label>
            <label className="field">
              <span>What they listened to</span>
              <textarea rows={3} value={draft.favoriteSongs} onChange={(event) => update("favoriteSongs", event.target.value)} placeholder="Songs or artists, one per line" />
            </label>
            <label className="field field-full">
              <span>Words that still sound like them</span>
              <textarea rows={2} value={draft.rememberedWords} onChange={(event) => update("rememberedWords", event.target.value)} placeholder="A saying, a greeting, a piece of advice…" />
            </label>
            <label className="field field-full">
              <span>A remembrance, if you already have one</span>
              <textarea rows={4} maxLength={12000} value={draft.remembrance} onChange={(event) => update("remembrance", event.target.value)} placeholder="Write in your own words. You can also ask the local model for a draft later." />
            </label>
          </div>

          {error && <p className="inline-error" role="alert">{error}</p>}
          <footer className="dialog-actions">
            <span className="privacy-caption">Saved only in this browser</span>
            <div>
              <button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={saving || photoBusy}>
                {saving ? "Saving…" : initial ? "Save changes" : "Save to the garden"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
