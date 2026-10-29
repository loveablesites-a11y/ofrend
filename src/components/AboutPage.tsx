import { ArrowUpRight, Flower2, LockKeyhole, MemoryStick, WifiOff } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="page-wrap about-page">
      <header className="about-hero">
        <p className="eyebrow">WHY THIS GARDEN EXISTS</p>
        <h1>A little light<br /><em>kept close.</em></h1>
        <p className="about-lede">Ofrenda is a private memory garden built for Hacktoberfest’s “Ghost in the Machine” challenge. Inspired by the season of Día de los Muertos, it offers a small digital place for the stories people carry forward—not a replacement for the traditions or gatherings they come from.</p>
        <div className="about-byline"><span className="brand-mark brand-mark-small"><Flower2 size={16} /></span><span>Made for remembering, not for collecting data.</span></div>
      </header>

      <section className="about-story about-section">
        <div className="about-index">01 <span>THE IDEA</span></div>
        <div className="about-content"><h2>Memory belongs to the person keeping it.</h2><p>A digital ofrenda gathers the details that can disappear from a family album: a favorite dish, an old song, the phrase someone always said. Ofrenda lets someone place those details together and write a remembrance in their own words.</p><p>The open model is an optional helper, not the keeper of anyone’s history. It can offer a first draft. The person who remembers decides what stays.</p></div>
      </section>

      <section className="about-principles">
        <article><span className="principle-icon"><LockKeyhole size={19} /></span><p className="eyebrow">ON YOUR DEVICE</p><h3>No account. No memory upload.</h3><p>Profiles, photos, and drafts are stored in this browser’s IndexedDB. The app has no profile server or hosted AI endpoint.</p></article>
        <article><span className="principle-icon"><MemoryStick size={19} /></span><p className="eyebrow">OPEN-WEIGHT AI</p><h3>See what the helper runs on.</h3><p>Writing uses Hugging Face Transformers.js and SmolLM2-360M-Instruct, a model with publicly available weights. Inference runs in a browser worker.</p></article>
        <article><span className="principle-icon"><WifiOff size={19} /></span><p className="eyebrow">A REAL TRADE-OFF</p><h3>Download once, if you choose.</h3><p>The optional 4-bit model is about 390 MB and its first download needs internet. After assets are cached, writing can run locally while the browser keeps those files. Browser storage may be cleared. Profile viewing, editing, and backup do not need the model.</p></article>
      </section>

      <section className="about-section about-open">
        <div className="about-index">02 <span>WHY OPEN INNOVATION</span></div>
        <div className="about-content"><h2>Privacy you can inspect, not just a promise.</h2><p>A closed text-generation service would mean sending intimate family stories to an endpoint someone else operates. Here, the browser downloads the model files only after a person opts in. Their memorial text is sent to a local worker for inference and does not go to an AI provider.</p><p>Using open weights also makes the choice visible: the model has a name, files, and published limitations. It is small enough to run on ordinary personal computers, although its writing is imperfect and it primarily understands English. The application remains useful without AI, and every generated paragraph is an editable draft rather than a saved fact.</p></div>
      </section>

      <section className="about-note"><span><Flower2 size={20} /></span><div><p className="eyebrow">A NOTE ON CARE</p><p>Ofrenda is a small personal archive, not a substitute for a family’s only backup. Export your garden when you want another copy. The person writing remains the authority on every memory.</p></div></section>

      <footer className="source-list"><p className="eyebrow">WHAT THIS PROJECT IS BUILT ON</p><a href="https://huggingface.co/docs/transformers.js/en/index" target="_blank" rel="noreferrer">Transformers.js documentation <ArrowUpRight size={14} /></a><a href="https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct" target="_blank" rel="noreferrer">SmolLM2-360M-Instruct model card <ArrowUpRight size={14} /></a><a href="https://github.com/huggingface/transformers.js/blob/main/packages/transformers/docs/source/tutorials/next.md" target="_blank" rel="noreferrer">Official browser-worker tutorial <ArrowUpRight size={14} /></a></footer>
    </main>
  );
}
