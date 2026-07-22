import React, { useEffect } from "react";
import { Icon } from "@iconify-icon/react";

const CUSTOM_STYLES = `
  a { color: inherit; }
  html { scroll-behavior: smooth; }
  * { box-sizing: border-box; }
`;

const PRINCIPLES = [
  {
    icon: "mdi:package-variant",
    title: "Universal Packet",
    text: "Everything enters the system as one packet. Standardized structure across all inputs and outputs.",
  },
  {
    icon: "mdi:database-outline",
    title: "Knowledge First",
    text: "Knowledge is infrastructure. Not prompts. Not documentation. A living routing system.",
  },
  {
    icon: "mdi:robot-outline",
    title: "AI Native",
    text: "Humans and AI consume identical structures. No duplicate systems.",
  },
  {
    icon: "mdi:puzzle-outline",
    title: "Composable",
    text: "Every operation is reusable. Chain, modify, and scale infinitely.",
  },
];

const ARTIFACTS = [
  "Requests",
  "Knowledge",
  "Rules",
  "Documents",
  "Workflows",
  "AI conversations",
];

const NAV_LINKS = ["Concept", "Principles", "Architecture", "Use Cases"];

const ArkOS: React.FC = () => {
  useEffect(() => {
    const tailwind = document.createElement("script");
    tailwind.src = "https://cdn.tailwindcss.com";
    tailwind.id = "arkos-tailwind-cdn";
    if (!document.getElementById("arkos-tailwind-cdn"))
      document.head.appendChild(tailwind);

    const fonts = document.createElement("link");
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap";
    fonts.rel = "stylesheet";
    fonts.id = "arkos-fonts";
    if (!document.getElementById("arkos-fonts"))
      document.head.appendChild(fonts);

    return () => {
      document.getElementById("arkos-tailwind-cdn")?.remove();
      document.getElementById("arkos-fonts")?.remove();
    };
  }, []);

  return (
    <div
      className="bg-neutral-950 text-neutral-50 min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{CUSTOM_STYLES}</style>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded-[3px]" />
            <span className="text-sm font-medium tracking-tight">ARK</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-xs text-neutral-500 hover:text-white transition-colors tracking-wide"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-500 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v1.0 · Live
            </div>
            <a
              href="#"
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
            >
              <Icon icon="mdi:github" width={14} height={14} />
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header
        className="relative flex items-end overflow-hidden"
        style={{ height: "calc(70vh + 48px)", minHeight: 520 }}
      >
        <div className="absolute inset-0">
          <img
            src="/images/ark_splash.jpeg"
            alt="ARK"
            className="w-full h-full object-cover object-top"
            style={{ opacity: 0.85 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.05) 0%, rgba(10,10,10,0.3) 60%, #0a0a0a 100%)",
            }}
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-10 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-tight max-w-2xl">
            AI needs an
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to right, #ffffff, #666)",
              }}
            >
              operating architecture.
            </span>
          </h1>
        </div>
      </header>

      {/* Bento grid */}
      <main className="max-w-6xl mx-auto px-5 py-6">
        {/* Summary + artifacts row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Summary — spans 2 */}
          <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">
              Concept
            </p>
            <p className="text-xl md:text-2xl font-medium text-white leading-snug tracking-tight mb-3">
              ARK treats everything as an artifact moving through a system.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Instead of dozens of disconnected services, there is one
              orchestration model. Everything becomes one canonical packet.
            </p>
          </div>

          {/* Artifact types */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">
              Artifact types
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {ARTIFACTS.map((a) => (
                <span
                  key={a}
                  className="px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-xs text-neutral-300"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Principles bento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {PRINCIPLES.map(({ icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 transition-colors duration-300 p-5 flex flex-col"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                <Icon icon={icon} width={16} height={16} />
              </div>
              <p className="text-sm font-medium text-white mb-2">{title}</p>
              <p className="text-xs text-neutral-500 leading-relaxed mt-auto">
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-medium text-white mb-1">
                Build serious AI infrastructure.
              </p>
              <p className="text-xs text-neutral-500">
                Open source orchestration engine for teams and enterprises.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="#"
                className="h-8 px-4 rounded-full bg-white text-black text-xs font-medium flex items-center gap-1.5 hover:bg-neutral-200 transition-colors whitespace-nowrap"
              >
                Start Building
                <Icon icon="mdi:arrow-right" width={12} height={12} />
              </a>
              <a
                href="#"
                className="h-8 px-4 rounded-full border border-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 hover:bg-neutral-900 transition-colors whitespace-nowrap"
              >
                <Icon icon="mdi:book-open-outline" width={12} height={12} />
                Docs
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">
              Status
            </p>
            <div className="space-y-2">
              {[
                "Orchestration Engine",
                "Knowledge Router",
                "Packet Schema",
              ].map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">{s}</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Live
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-6 py-6">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-700 rounded-[3px]" />
            <span className="text-xs font-medium text-neutral-500">
              ARK Architecture
            </span>
          </div>
          <span className="text-xs text-neutral-600">
            © 2024 · Open source orchestrator
          </span>
        </div>
      </footer>
    </div>
  );
};

export default ArkOS;
