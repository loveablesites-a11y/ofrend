import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Flower2, Import, LockKeyhole } from "lucide-react";
import AboutPage from "./components/AboutPage";
import MemorialEditor from "./components/MemorialEditor";
import MemoryGarden from "./components/MemoryGarden";
import { createBackup, parseBackup } from "./lib/backup";
import { readMemorials, writeMemorials } from "./lib/storage";
import type { Memorial, ModelProgress, ModelState } from "./lib/types";

type WorkerEvent = {
  type?: string;
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
  text?: string;
  message?: string;
  requestId?: string;
  personId?: string;
};

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingGarden, setLoadingGarden] = useState(true);
  const [storageWarning, setStorageWarning] = useState("");
  const [notification, setNotification] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Memorial | undefined>();
  const [draftsById, setDraftsById] = useState<Record<string, string>>({});
  const [modelState, setModelState] = useState<ModelState>("not-downloaded");
  const [modelProgress, setModelProgress] = useState<ModelProgress>({});
  const [modelError, setModelError] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const pendingGenerationRef = useRef<{ requestId: string; personId: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const selected = memorials.find((person) => person.id === selectedId);
  const draft = selected ? draftsById[selected.id] ?? selected.remembrance ?? "" : "";
  const isAbout = route.replace(/\/$/, "") === "/about";

  useEffect(() => {
    const onRouteChange = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onRouteChange);
    return () => window.removeEventListener("popstate", onRouteChange);
  }, []);

  useEffect(() => {
    let active = true;
    void readMemorials()
      .then((saved) => {
        if (!active) return;
        setMemorials(saved);
        setSelectedId(saved[0]?.id ?? "");
      })
      .catch(() => {
        if (active) setStorageWarning("This browser could not open local storage. You can still use the page, but changes may not survive closing it; export a backup before you leave.");
      })
      .finally(() => active && setLoadingGarden(false));
    return () => { active = false; };
  }, []);

  const getOrCreateWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    if (typeof Worker === "undefined") {
      setModelState("error");
      setModelError("This browser does not support the local AI worker. You can still write and save a remembrance yourself.");
      return null;
    }
    try {
      const worker = new Worker(new URL("./ai/remembrance.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<WorkerEvent>) => {
        const message = event.data;
        if (message.type === "progress") {
          setModelState("downloading");
          setModelProgress({ file: message.file, progress: message.progress, loaded: message.loaded, total: message.total });
        } else if (message.type === "ready") {
          setModelState("ready");
          setModelError("");
          setModelProgress({});
        } else if (message.type === "generated") {
          const pending = pendingGenerationRef.current;
          if (!pending || message.requestId !== pending.requestId || message.personId !== pending.personId) return;
          setDraftsById((current) => ({ ...current, [pending.personId]: message.text ?? "" }));
          pendingGenerationRef.current = null;
          setModelState("completed");
          setModelError("");
        } else if (message.type === "error") {
          if (message.requestId && message.requestId !== pendingGenerationRef.current?.requestId) return;
          pendingGenerationRef.current = null;
          setModelState("error");
          setModelError(message.message ?? "The local model could not complete that request.");
        }
      };
      worker.onerror = () => {
        pendingGenerationRef.current = null;
        setModelState("error");
        setModelError("The local model could not start. Your saved memories remain available without it.");
      };
      workerRef.current = worker;
      return worker;
    } catch {
      setModelState("error");
      setModelError("The local AI worker could not start. You can still write and save a remembrance yourself.");
      return null;
    }
  }, []);

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(() => setNotification(""), 6200);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const persist = useCallback(async (next: Memorial[]) => {
    setMemorials(next);
    try {
      await writeMemorials(next);
      setStorageWarning("");
    } catch {
      const warning = "The browser could not save to local storage. Your changes are visible for now, but may be lost when you close this page. Export a backup before leaving.";
      setStorageWarning(warning);
      throw new Error(warning);
    }
  }, []);

  const saveProfile = useCallback(async (person: Memorial) => {
    const exists = memorials.some((item) => item.id === person.id);
    const next = exists ? memorials.map((item) => item.id === person.id ? person : item) : [...memorials, person];
    setSelectedId(person.id);
    setDraftsById((current) => ({ ...current, [person.id]: person.remembrance }));
    await persist(next);
    setEditorOpen(false);
    setEditing(undefined);
    setNotification(`${person.name} has a place in your garden.`);
  }, [memorials, persist]);

  function openNew() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function openEdit() {
    if (!selected) return;
    setEditing(selected);
    setEditorOpen(true);
  }

  async function removeSelected() {
    if (!selected) return;
    if (!window.confirm(`Remove ${selected.name} and their memories from this browser? Export a garden backup first if you want to keep them.`)) return;
    const next = memorials.filter((person) => person.id !== selected.id);
    await persist(next);
    setSelectedId(next[0]?.id ?? "");
    setNotification("The memorial was removed from this browser.");
  }

  function loadModel() {
    const worker = getOrCreateWorker();
    if (!worker) return;
    pendingGenerationRef.current = null;
    setModelError("");
    setModelProgress({});
    setModelState("downloading");
    worker.postMessage({ type: "load" });
  }

  function generateDraft() {
    const worker = workerRef.current;
    if (!selected || !worker || modelState === "generating") return;
    const requestId = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingGenerationRef.current = { requestId, personId: selected.id };
    setModelError("");
    setModelState("generating");
    worker.postMessage({
      type: "generate",
      requestId,
      personId: selected.id,
      person: {
        name: selected.name,
        relationship: selected.relationship,
        story: selected.story,
        favoriteFoods: selected.favoriteFoods,
        favoriteSongs: selected.favoriteSongs,
        rememberedWords: selected.rememberedWords,
      },
    });
  }

  async function saveRemembrance() {
    if (!selected || !draft.trim()) return;
    const updated = { ...selected, remembrance: draft.trim(), updatedAt: new Date().toISOString() };
    setDraftsById((current) => ({ ...current, [selected.id]: draft.trim() }));
    await persist(memorials.map((person) => person.id === selected.id ? updated : person));
    setNotification("Your remembrance has been saved on this device.");
  }

  function exportGarden() {
    if (!memorials.length) return;
    const blob = new Blob([createBackup(memorials)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ofrenda-garden-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotification("A copy of your garden was downloaded to this device.");
  }

  async function importGarden(file?: File) {
    if (!file) return;
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      const existingIds = new Set(memorials.map((person) => person.id));
      const additions = parsed.filter((person) => {
        if (existingIds.has(person.id)) return false;
        existingIds.add(person.id);
        return true;
      });
      if (!additions.length) {
        setNotification("This backup has no new profiles to add. Existing profiles were left unchanged.");
        return;
      }
      if (!window.confirm(`Add ${additions.length} profile${additions.length === 1 ? "" : "s"} from this backup? Matching IDs are skipped, and nothing in your current garden will be replaced.`)) return;
      await persist([...memorials, ...additions]);
      if (!selectedId) setSelectedId(additions[0].id);
      setNotification(`${additions.length} profile${additions.length === 1 ? "" : "s"} added from your backup.`);
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "That backup could not be imported.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand-lockup" href="/" aria-label="Ofrenda home">
          <span className="brand-mark"><Flower2 size={19} strokeWidth={1.8} /></span>
          <span className="brand-name">ofrenda<span>.</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className={!isAbout ? "nav-current" : ""} href="/">The garden</a>
          <a className={isAbout ? "nav-current" : ""} href="/about">Why this is open</a>
        </nav>
        <div className="header-actions">
          {!isAbout && <><button className="button button-small button-outline header-import" onClick={() => importRef.current?.click()} disabled={loadingGarden}><Import size={14} /> Import backup</button><button className="button button-small button-header" onClick={exportGarden} disabled={!memorials.length}><span className="export-label">Export garden</span><ArrowUpRight size={14} /></button></>}
          {isAbout && <a className="button button-small button-header" href="/">Return to the garden <ArrowUpRight size={14} /></a>}
        </div>
        <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importGarden(event.currentTarget.files?.[0])} />
      </header>

      <div className="privacy-banner"><LockKeyhole size={13} /><span>Private by design</span><i></i><span>Your memories stay in this browser</span></div>
      {notification && <div className="toast" role="status">{notification}</div>}

      {isAbout ? <AboutPage /> : (
        <MemoryGarden
          memorials={memorials}
          selected={selected}
          modelState={modelState}
          modelProgress={modelProgress}
          modelError={modelError}
          draft={draft}
          onSelect={setSelectedId}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={() => void removeSelected()}
          onLoadModel={loadModel}
          onGenerate={generateDraft}
          onDraftChange={(value) => selectedId && setDraftsById((current) => ({ ...current, [selectedId]: value }))}
          onSaveRemembrance={() => void saveRemembrance()}
          onExport={exportGarden}
          onImport={() => importRef.current?.click()}
          storageWarning={storageWarning || (loadingGarden ? "Opening your garden on this device…" : "")}
        />
      )}

      <footer className="site-footer"><a className="footer-brand" href="/"><Flower2 size={15} /> ofrenda.</a><span>Keep what you love within reach.</span><a href="/about">How the local model works <ArrowUpRight size={12} /></a></footer>

      {editorOpen && <MemorialEditor initial={editing} onCancel={() => { setEditorOpen(false); setEditing(undefined); }} onSave={saveProfile} />}
    </div>
  );
}
