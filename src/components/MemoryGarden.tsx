import { useEffect, useState } from "react";
import {
  BookOpenText,
  ChevronRight,
  CircleHelp,
  Download,
  Flower2,
  Heart,
  LoaderCircle,
  LockKeyhole,
  Music2,
  Plus,
  RefreshCw,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { Memorial, ModelProgress, ModelState } from "../lib/types";

interface MemoryGardenProps {
  memorials: Memorial[];
  selected?: Memorial;
  modelState: ModelState;
  modelProgress: ModelProgress;
  modelError: string;
  draft: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLoadModel: () => void;
  onGenerate: () => void;
  onDraftChange: (value: string) => void;
  onSaveRemembrance: () => void;
  onExport: () => void;
  onImport: () => void;
  storageWarning?: string;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function years(person: Memorial) {
  const first = person.birthYear.trim();
  const last = person.passingYear.trim();
  if (first && last) return `${first} — ${last}`;
  return first || last || "A life remembered";
}

function KeepsakeList({ title, items, icon, empty }: { title: string; items: string[]; icon: React.ReactNode; empty: string }) {
  return (
    <section className="keepsake-card">
      <div className="keepsake-heading">{icon}<h3>{title}</h3></div>
      {items.length ? (
        <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
      ) : <p className="keepsake-empty">{empty}</p>}
    </section>
  );
}

function modelLabel(state: ModelState) {
  switch (state) {
    case "not-downloaded": return "Not downloaded";
    case "downloading": return "Downloading to this device";
    case "ready": return "Ready on this device";
    case "generating": return "Writing locally";
    case "completed": return "Draft ready to review";
    case "error": return "Local AI needs attention";
  }
}

export default function MemoryGarden(props: MemoryGardenProps) {
  const {
    memorials, selected, modelState, modelProgress, modelError, draft,
    onSelect, onAdd, onEdit, onDelete, onLoadModel, onGenerate,
    onDraftChange, onSaveRemembrance, onExport, onImport, storageWarning,
  } = props;
  const [draftDirty, setDraftDirty] = useState(false);

  useEffect(() => {
    setDraftDirty(false);
  }, [selected?.id, selected?.remembrance]);
  const generationRunning = modelState === "generating";

  const progressValue = typeof modelProgress.progress === "number"
    ? Math.max(0, Math.min(100, Math.round(modelProgress.progress <= 1 ? modelProgress.progress * 100 : modelProgress.progress)))
    : undefined;
  const statusForStyles = modelState === "error" ? "state-error" : modelState === "completed" ? "state-complete" : modelState === "ready" ? "state-ready" : "";

  return (
    <main className="page-wrap garden-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">A PRIVATE PLACE TO REMEMBER</p>
          <h1>What we remember<br className="desktop-break" /> stays close.</h1>
          <p className="intro-copy">A little garden for the stories, songs, and familiar things that keep someone near.</p>
        </div>
        <div className="intro-note"><Flower2 size={17} /><span>Made for the living<br />to carry what matters</span></div>
      </section>

      {storageWarning && <div className="notice notice-warn" role="status"><CircleHelp size={17} />{storageWarning}</div>}

      {memorials.length === 0 ? (
        <section className="empty-garden">
          <div className="empty-copy">
            <span className="empty-mark"><Flower2 size={30} /></span>
            <p className="eyebrow">YOUR GARDEN IS READY</p>
            <h2>Begin with one small thing.</h2>
            <p>A name, the smell of Sunday bread, a song from the car ride home. Start anywhere. You can add more whenever you like.</p>
            <button className="button button-primary" onClick={onAdd}><Plus size={17} /> Make a place for someone</button>
            <div className="privacy-line"><LockKeyhole size={14} />Your memories stay on this device.</div>
          </div>
          <div className="quiet-still-life" aria-hidden="true">
            <div className="still-life-halo"></div>
            <div className="still-life-stem stem-one"></div>
            <div className="still-life-stem stem-two"></div>
            <div className="still-life-stem stem-three"></div>
            <div className="still-life-vase"><span></span></div>
            <div className="still-life-note">a place<br />to return</div>
          </div>
        </section>
      ) : (
        <div className="garden-workspace">
          <aside className="garden-rail">
            <div className="rail-heading"><div><p className="eyebrow">THE GARDEN</p><h2>Remembered</h2></div><span className="profile-count">{memorials.length.toString().padStart(2, "0")}</span></div>
            <div className="profile-list" role="list" aria-label="Memorial profiles">
              {memorials.map((person) => (
                <button
                  className={`profile-choice ${selected?.id === person.id ? "is-selected" : ""}`}
                  key={person.id}
                  onClick={() => onSelect(person.id)}
                  disabled={generationRunning}
                  aria-current={selected?.id === person.id ? "true" : undefined}
                >
                  <span className="mini-avatar">
                    {person.photo ? <img src={person.photo} alt="" /> : <span>{initials(person.name)}</span>}
                  </span>
                  <span className="profile-choice-copy"><strong>{person.name}</strong><small>{person.relationship || "A life remembered"}</small></span>
                  <ChevronRight size={15} className="profile-arrow" />
                </button>
              ))}
            </div>
            <button className="add-person-link" onClick={onAdd} disabled={generationRunning}><Plus size={16} /> Add someone</button>
            <div className="rail-footnote"><LockKeyhole size={15} /><p>Private by design.<br /><span>Your words stay on this device.</span></p></div>
          </aside>

          {selected ? (
            <article className="memorial-detail">
              <div className="detail-topline"><span><span className="tiny-dot"></span> A LIFE, HELD CLOSE</span><div className="detail-actions"><button className="button button-small button-outline" onClick={onEdit} disabled={generationRunning}>Edit memory</button><button className="text-button delete-link" onClick={onDelete} disabled={generationRunning}>Remove</button></div></div>
              <header className="person-hero">
                <div className="person-portrait">
                  {selected.photo ? <img src={selected.photo} alt={`Portrait of ${selected.name}`} /> : <div className="portrait-placeholder"><span>{initials(selected.name)}</span><Flower2 size={18} /></div>}
                </div>
                <div className="person-heading"><p className="eyebrow">{selected.relationship || "A LIFE REMEMBERED"}</p><h2>{selected.name}</h2><span className="person-years">{years(selected)}</span></div>
                <span className="hero-flower" aria-hidden="true"><Flower2 size={45} strokeWidth={1} /></span>
              </header>

              <div className="detail-rule"><span></span><Flower2 size={14} /><span></span></div>

              <section className="story-section">
                <div className="section-heading"><span className="section-number">01</span><div><p className="eyebrow">THE STORY WE CARRY</p><h3>A moment that stays</h3></div></div>
                {selected.story ? <p className="story-text">{selected.story}</p> : <p className="quiet-prompt">Some memories arrive as a whole story. Others begin with a single detail. Add one whenever you’re ready.</p>}
              </section>

              <div className="keepsake-shelf">
                <KeepsakeList title="At their table" items={selected.favoriteFoods} icon={<Utensils size={17} />} empty="A favorite taste, saved for later." />
                <KeepsakeList title="On their playlist" items={selected.favoriteSongs} icon={<Music2 size={17} />} empty="The songs that bring them near." />
                <KeepsakeList title="Words that remain" items={selected.rememberedWords} icon={<BookOpenText size={17} />} empty="A familiar phrase, in their voice." />
              </div>

              <section className="remembrance-section">
                <div className="section-heading"><span className="section-number">02</span><div><p className="eyebrow">IN YOUR OWN WORDS</p><h3>A remembrance</h3></div></div>
                <p className="section-intro">Write it yourself, or let a small open model on your device help shape the details you’ve saved.</p>
                <label className="visually-hidden" htmlFor="remembrance-draft">Your remembrance draft</label>
                <textarea
                  id="remembrance-draft"
                  className="remembrance-editor"
                  value={draft}
                  onChange={(event) => { onDraftChange(event.target.value); setDraftDirty(true); }}
                  placeholder="A few honest words are enough. You can ask for a local draft below, then make it your own."
                  rows={6}
                />
                <div className="save-row"><span className="save-hint">{modelState === "completed" && !draftDirty ? "A draft is ready. Read it through before saving." : "Your words are saved only when you choose to save."}</span><button className="button button-primary" onClick={onSaveRemembrance} disabled={!draft.trim() || (!draftDirty && draft.trim() === (selected.remembrance ?? "").trim())}>Save remembrance</button></div>
              </section>

              <section className="local-ai-card">
                <div className="ai-head">
                  <span className="ai-icon"><Sparkles size={18} /></span>
                  <div className="ai-title"><p className="eyebrow">OPTIONAL · RUNS IN YOUR BROWSER</p><h3>Shape a remembrance</h3></div>
                  <span className={`model-state ${statusForStyles}`}><span className="state-dot"></span>{modelLabel(modelState)}</span>
                </div>
                <p className="ai-explainer">An open-weight model can turn the details you’ve written above into a first draft. Your memories stay on this device; no hosted AI receives them. The first model download is about 390 MB and needs internet.</p>
                {modelState === "not-downloaded" && <div className="ai-actions"><button className="button button-dark" onClick={onLoadModel}><Download size={16} /> Prepare local writing</button><span>Nothing downloads until you choose.</span></div>}
                {modelState === "downloading" && <div className="model-progress-wrap"><div className="progress-label"><span>{modelProgress.file ? `Loading ${modelProgress.file.split("/").at(-1)}` : "Preparing the local model…"}</span><span>{progressValue !== undefined ? `${progressValue}%` : ""}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progressValue ?? 8}%` }} /></div><p>Keep this page open. Model files are fetched from Hugging Face; your memorial text is not part of that download.</p></div>}
                {(modelState === "ready" || modelState === "completed") && <div className="ai-actions"><button className="button button-dark" onClick={onGenerate}><Sparkles size={16} /> {modelState === "completed" ? "Write another draft" : "Draft from these memories"}</button><span>Review every line before saving.</span></div>}
                {modelState === "generating" && <div className="generating-note"><LoaderCircle className="spin" size={16} /> Writing on this device… Your words are not being sent.</div>}
                {modelState === "error" && <div className="ai-error" role="alert"><p>{modelError || "The local model could not start in this browser."}</p><button className="button button-small button-outline" onClick={onLoadModel}><RefreshCw size={14} /> Try again</button></div>}
                <div className="ai-footnote"><Heart size={13} /> The model can get things wrong. Your memory is the source of truth.</div>
              </section>
            </article>
          ) : (
            <section className="missing-profile"><p className="eyebrow">YOUR GARDEN</p><h2>Choose someone to remember.</h2><button className="button button-primary" onClick={onAdd}><Plus size={16} /> Add someone</button></section>
          )}
        </div>
      )}

      <footer className="page-tools"><p>Keep a copy in your own hands.</p><div><button className="text-button" onClick={onExport} disabled={!memorials.length}><Download size={14} /> Export garden</button><button className="text-button" onClick={onImport}><Plus size={14} /> Import backup</button></div></footer>
    </main>
  );
}
