import React, { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import PortfolioComponent from "../components/Portfolio";
import type { PortfolioItem } from "../components/Portfolio/types";
import portfolioProjects from "./portfolioProjects.json";

// design.md — "AI Labs": research-paper white, single terminal-green accent.
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap";
const CONTACT_EMAIL = "donohue.matt@gmail.com";

type Skill = {
  icon: string;
  title: string;
  text: string;
  tags: string[];
};

type Highlight = { title: string; text: string };

type Role = {
  title: string;
  company: string;
  period: string;
  bullets: string[];
  highlights?: Highlight[];
  tags?: string[];
};

const SKILLS: Skill[] = [
  {
    icon: "lucide:layers",
    title: "Full-Stack Architecture",
    text: "React, Next.js, TypeScript, MUI, Tailwind CSS, Node.js, Express, Python Flask/FastAPI.",
    tags: ["React", "TypeScript", "Node.js", "Flask", "FastAPI"],
  },
  {
    icon: "lucide:server",
    title: "Distributed Systems",
    text: "Microservices, Event-Driven Messaging, High-throughput data services.",
    tags: ["Kafka", "RabbitMQ", "AWS/GCP"],
  },
  {
    icon: "lucide:database",
    title: "Data & ML Operations",
    text: "Airflow, PostgreSQL, MongoDB, Redis, Python/Pandas, Jupyter.",
    tags: ["PostgreSQL", "Airflow", "Python"],
  },
  {
    icon: "lucide:cpu",
    title: "AI & Automation",
    text: "LLM integration, agent-based workflows, AI-assisted code review pipelines.",
    tags: ["LLM Inference", "Automation"],
  },
  {
    icon: "lucide:video",
    title: "Streaming & Media",
    text: "High-volume live streaming workflows, asset metadata sync, fingerprinting.",
    tags: ["FFMPEG", "HLS", "RTMP"],
  },
  {
    icon: "lucide:shield-check",
    title: "DevOps & Reliability",
    text: "Docker, Kubernetes, CI/CD, Observability, and Production Optimization.",
    tags: ["Kubernetes", "Docker", "CI/CD"],
  },
];

const ROLES: Role[] = [
  {
    title: "Senior Engineer / Solution Architect",
    company: "NBCUniversal",
    period: "Feb 2022 – Apr 2025",
    bullets: [
      "Architected distributed systems for large-scale rights management and live content protection workflows.",
      "Built cross-platform asset metadata sync across YouTube Content ID & Facebook Rights Manager, reducing manual overhead by 50%+.",
      "Designed and operated live streaming infrastructure supporting 20+ concurrent streams with real-time monitoring.",
    ],
    highlights: [
      {
        title: "Olympics 2024 Operations",
        text: "70,000+ live fingerprints, 800+ IP sources, 99.9% accuracy. Supported partnership extension.",
      },
      {
        title: "Platform Optimization",
        text: "Reduced asset latency by 40%, achieved 100% delivery SLA within year one.",
      },
    ],
  },
  {
    title: "Senior Developer / Solution Architect",
    company: "Netrix LLC",
    period: "2005 – 2022",
    bullets: [
      "Built multi-cloud platform services across AWS, Azure, GCP, and VMware, supporting recurring revenue products.",
      "Designed Node.js middleware and Python/Flask services for secure API orchestration and long-running workflows.",
      "Led senior engineering team through major releases, owning architecture decisions and delivery execution.",
    ],
    tags: ["CloudHelm", "ERP/ETL Pipelines", "Rapidata (acquired by Nasdaq)"],
  },
];

const SOCIAL_LINKS = [
  {
    icon: "lucide:linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/matt-donohue-609b084/",
  },
  {
    icon: "lucide:github",
    label: "GitHub",
    href: "https://github.com/mmdonohue",
  },
  { icon: "lucide:mail", label: "Email", href: `mailto:${CONTACT_EMAIL}` },
];

const DESERT_IMAGES = [
  "/assets/img/desert_2135.JPEG",
  "/assets/img/desert_2699.JPEG",
  "/assets/img/desert_4776.JPEG",
  "/assets/img/desert_3993.JPEG",
];

const ARK_FEATURE = {
  href: "/ark-os",
  image: "/images/ark_backpack.png",
  alt: "ARK field kit — backpack with AI First, DevOps First, ADHD First and Apocalypse First patches",
  title: "ARK OS",
  subtitle: "Operating architecture for AI",
};

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#skills", label: "Expertise" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
];

const STYLES = `
.pf {
  --pf-primary: #0F1112;
  --pf-secondary: #6F7478;
  --pf-tertiary: #00A36C;
  --pf-tertiary-hover: #008F5F;
  --pf-neutral: #FAFAF8;
  --pf-surface: #FFFFFF;
  --pf-on-primary: #FFFFFF;
  --pf-hairline: rgba(111, 116, 120, 0.22);
  --pf-hairline-strong: rgba(111, 116, 120, 0.55);
  --pf-r-sm: 3px;
  --pf-r-md: 5px;
  --pf-r-lg: 8px;
  --pf-sp-sm: 8px;
  --pf-sp-md: 16px;
  --pf-sp-lg: 32px;
  --pf-sans: "IBM Plex Sans", system-ui, sans-serif;
  --pf-mono: "IBM Plex Mono", ui-monospace, monospace;

  background: var(--pf-neutral);
  color: var(--pf-primary);
  font-family: var(--pf-sans);
  font-size: 0.95rem;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.pf section { scroll-margin-top: 96px; }
.pf ::selection { background: var(--pf-primary); color: var(--pf-on-primary); }

.pf-label {
  font-family: var(--pf-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pf-secondary);
}
.pf-display {
  font-size: 3.5rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.05;
}
.pf-h1 { font-size: 2rem; font-weight: 500; letter-spacing: -0.01em; line-height: 1.2; }
.pf-h2 { font-size: 1.1rem; font-weight: 500; line-height: 1.35; }
.pf-muted { color: var(--pf-secondary); }

/* Nav */
.pf-nav {
  position: fixed; inset: 0 0 auto 0; z-index: 50;
  background: var(--pf-neutral);
  border-bottom: 1px solid var(--pf-hairline);
}
.pf-nav-inner {
  max-width: 72rem; margin: 0 auto; height: 64px;
  padding: 0 var(--pf-sp-md);
  display: flex; align-items: center; justify-content: space-between; gap: var(--pf-sp-md);
}
.pf-link { color: var(--pf-secondary); text-decoration: none; transition: color .15s; }
.pf-link:hover { color: var(--pf-primary); }

.pf-btn-primary {
  display: inline-flex; align-items: center; gap: var(--pf-sp-sm);
  background: var(--pf-tertiary); color: var(--pf-on-primary);
  border-radius: var(--pf-r-md); padding: 12px 20px;
  font-weight: 500; text-decoration: none; white-space: nowrap;
  transition: background .15s;
}
.pf-btn-primary:hover { background: var(--pf-tertiary-hover); }

.pf-btn-outline {
  display: inline-flex; align-items: center; gap: var(--pf-sp-sm);
  background: var(--pf-surface); color: var(--pf-primary);
  border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-md);
  padding: 8px 14px; text-decoration: none; transition: border-color .15s;
}
.pf-btn-outline:hover { border-color: var(--pf-primary); }

/* Layout */
.pf-main {
  max-width: 72rem; margin: 0 auto;
  padding: calc(64px + 96px) var(--pf-sp-md) 96px;
  display: flex; flex-direction: column; gap: 112px;
}
@media (min-width: 1024px) {
  .pf-main { padding-left: calc(var(--pf-sp-md) + 15rem); }
}
.pf-section-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--pf-sp-lg); }

/* Hero + featured figure */
.pf-hero { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
@media (min-width: 1024px) { .pf-hero { grid-template-columns: minmax(0, 1fr) 20rem; gap: 56px; } }
@media (min-width: 1280px) { .pf-hero { grid-template-columns: minmax(0, 1fr) 22rem; } }
.pf-hero-copy { max-width: 46rem; }
.pf-feature {
  display: block; text-decoration: none; color: var(--pf-primary);
  background: var(--pf-surface); border: 1px solid var(--pf-hairline);
  border-radius: var(--pf-r-lg); overflow: hidden; max-width: 24rem;
  transition: border-color .15s;
}
.pf-feature:hover { border-color: var(--pf-hairline-strong); }
.pf-feature img {
  display: block; width: 100%; aspect-ratio: 1145 / 1374; object-fit: cover;
  border-bottom: 1px solid var(--pf-hairline);
}
.pf-feature-caption { display: flex; flex-direction: column; gap: 4px; padding: var(--pf-sp-md); }
.pf-feature-title { font-weight: 500; }
.pf-feature-cta {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;
  color: var(--pf-secondary); transition: color .15s, gap .15s;
}
.pf-feature:hover .pf-feature-cta { color: var(--pf-primary); gap: 10px; }

/* Portrait figure */
.pf-figure {
  display: none; position: fixed; left: 24px; top: 112px; z-index: 40; width: 12rem; margin: 0;
}
@media (min-width: 1024px) { .pf-figure { display: block; } }
.pf-figure img {
  display: block; width: 100%;
  border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-sm);
  filter: grayscale(1) brightness(2.7) contrast(0.85);
}
.pf-figure figcaption { margin-top: var(--pf-sp-sm); }

/* Status */
.pf-status { display: inline-flex; align-items: center; gap: var(--pf-sp-sm); margin-bottom: var(--pf-sp-lg); }
.pf-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pf-primary); }

/* Cards */
.pf-grid { display: grid; grid-template-columns: 1fr; gap: var(--pf-sp-md); }
@media (min-width: 768px) { .pf-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .pf-grid { grid-template-columns: repeat(3, 1fr); } }
.pf-card {
  background: var(--pf-surface); color: var(--pf-primary);
  border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-lg);
  padding: 24px; transition: border-color .15s;
}
.pf-card:hover { border-color: var(--pf-hairline-strong); }
.pf-card-icon {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-md);
  margin-bottom: var(--pf-sp-md); color: var(--pf-primary);
}
.pf-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pf-tag {
  font-family: var(--pf-mono); font-size: 0.72rem;
  padding: 2px 8px; border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-sm);
  color: var(--pf-secondary); background: var(--pf-surface);
}

/* Timeline */
.pf-timeline { border-left: 1px solid var(--pf-hairline); margin-left: 4px; display: flex; flex-direction: column; gap: 56px; }
.pf-role { position: relative; padding-left: var(--pf-sp-lg); }
.pf-role-marker {
  position: absolute; left: -4px; top: 9px; width: 7px; height: 7px;
  background: var(--pf-primary); border-radius: 1px;
}
.pf-role-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--pf-sp-sm); }
.pf-bullets { list-style: none; padding: 0; margin: var(--pf-sp-md) 0 0; display: flex; flex-direction: column; gap: 10px; }
.pf-bullets li { display: flex; gap: 12px; }
.pf-bullets li::before { content: "—"; color: var(--pf-secondary); flex-shrink: 0; }
.pf-highlights {
  margin-top: var(--pf-sp-md); padding: var(--pf-sp-md);
  border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-lg); background: var(--pf-surface);
}
.pf-highlights-grid { display: grid; grid-template-columns: 1fr; gap: var(--pf-sp-md); margin-top: 12px; }
@media (min-width: 768px) { .pf-highlights-grid { grid-template-columns: 1fr 1fr; } }
.pf-highlight { border-left: 1px solid var(--pf-primary); padding-left: 12px; }

/* Desert hover figure */
.pf-desert-trigger {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 4px;
  color: var(--pf-secondary); cursor: pointer; background: none; border: 0; font: inherit;
}
.pf-desert-trigger:hover { color: var(--pf-primary); }
.pf-desert {
  position: fixed; top: 96px; right: 32px; z-index: 60; width: min(36rem, calc(100vw - 32px));
  background: var(--pf-surface); border: 1px solid var(--pf-hairline); border-radius: var(--pf-r-lg);
  padding: var(--pf-sp-md);
}
.pf-desert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--pf-sp-sm); margin-top: var(--pf-sp-sm); }
.pf-desert-grid img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--pf-r-sm); display: block; }

/* Footer */
.pf-footer { border-top: 1px solid var(--pf-hairline); padding-top: 48px; }

@media (max-width: 640px) {
  .pf-display { font-size: 2.5rem; }
  .pf-h1 { font-size: 1.6rem; }
}
`;

const SectionHead: React.FC<{ index: string; title: string }> = ({
  index,
  title,
}) => (
  <div className="pf-section-head">
    <span className="pf-label">
      {index} — {title}
    </span>
    <h2 className="pf-h1" style={{ margin: 0 }}>
      {title}
    </h2>
  </div>
);

const Portfolio: React.FC = () => {
  const [desertOpen, setDesertOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONT_URL;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="pf">
      <style>{STYLES}</style>

      <header className="pf-nav">
        <div className="pf-nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="/" className="pf-link pf-label">
              ← ZuZu
            </a>
            <span style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>
              Matt Donohue
            </span>
          </div>
          <nav className="hidden md:flex" style={{ gap: 28 }}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="pf-link">
                {l.label}
              </a>
            ))}
          </nav>
          <a href={`mailto:${CONTACT_EMAIL}`} className="pf-btn-primary">
            Get in touch
          </a>
        </div>
      </header>

      {desertOpen && (
        <div
          className="pf-desert"
          onMouseEnter={() => setDesertOpen(true)}
          onMouseLeave={() => setDesertOpen(false)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="pf-label">fig. 3 — Desert Hot Springs, CA</span>
            <button
              onClick={() => setDesertOpen(false)}
              className="pf-link"
              style={{ background: "none", border: 0, cursor: "pointer" }}
              aria-label="Close"
            >
              <Icon icon="lucide:x" width={16} height={16} />
            </button>
          </div>
          <div className="pf-desert-grid">
            {DESERT_IMAGES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Desert Hot Springs view ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <figure className="pf-figure">
        <img
          src="/assets/img/profile_ascii.png"
          alt="Matt Donohue, ASCII portrait"
        />
        <figcaption className="pf-label">fig. 1 — portrait.txt</figcaption>
      </figure>

      <main className="pf-main">
        <section id="about" className="pf-hero">
          <div className="pf-hero-copy">
            <div className="pf-status pf-label">
              <span className="pf-status-dot" />
              Available for new opportunities
            </div>
            <h1 className="pf-display" style={{ margin: 0 }}>
              Senior Software Engineer &amp; Solution Architect
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                margin: "24px 0 32px",
                maxWidth: "40rem",
              }}
              className="pf-muted"
            >
              15+ years of experience building and operating mission-critical
              production systems. Expertise in distributed architecture,
              full-stack development, and technical leadership. Proven ability
              to deliver scalable platforms and drive measurable business
              outcomes.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="pf-btn-outline"
                  {...(s.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <Icon icon={s.icon} width={16} height={16} />
                  {s.label}
                </a>
              ))}
              <button
                className="pf-desert-trigger"
                onClick={() => setDesertOpen((o) => !o)}
                onMouseEnter={() => setDesertOpen(true)}
                onMouseLeave={() => setDesertOpen(false)}
              >
                <Icon icon="lucide:map-pin" width={16} height={16} />
                Desert Hot Springs, CA
              </button>
            </div>
          </div>

          <a href={ARK_FEATURE.href} className="pf-feature">
            <img src={ARK_FEATURE.image} alt={ARK_FEATURE.alt} />
            <span className="pf-feature-caption">
              <span className="pf-label">fig. 2 — {ARK_FEATURE.title}</span>
              <span className="pf-feature-title">{ARK_FEATURE.subtitle}</span>
              <span className="pf-feature-cta">
                Explore ARK
                <Icon icon="lucide:arrow-right" width={14} height={14} />
              </span>
            </span>
          </a>
        </section>

        <section id="skills">
          <SectionHead index="01" title="Technical Expertise" />
          <div className="pf-grid">
            {SKILLS.map((s) => (
              <div key={s.title} className="pf-card">
                <div className="pf-card-icon">
                  <Icon icon={s.icon} width={18} height={18} />
                </div>
                <h3 className="pf-h2" style={{ margin: "0 0 6px" }}>
                  {s.title}
                </h3>
                <p className="pf-muted" style={{ margin: "0 0 16px" }}>
                  {s.text}
                </p>
                <div className="pf-tags">
                  {s.tags.map((t) => (
                    <span key={t} className="pf-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="experience">
          <SectionHead index="02" title="Experience" />
          <div className="pf-timeline">
            {ROLES.map((r) => (
              <article key={r.company} className="pf-role">
                <span className="pf-role-marker" />
                <div className="pf-role-head">
                  <h3 className="pf-h2" style={{ margin: 0 }}>
                    {r.title}
                  </h3>
                  <span className="pf-label">{r.period}</span>
                </div>
                <div className="pf-muted" style={{ fontWeight: 500 }}>
                  {r.company}
                </div>
                <ul className="pf-bullets">
                  {r.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {r.highlights && (
                  <div className="pf-highlights">
                    <span className="pf-label">Major highlights</span>
                    <div className="pf-highlights-grid">
                      {r.highlights.map((h) => (
                        <div key={h.title} className="pf-highlight">
                          <div style={{ fontWeight: 500 }}>{h.title}</div>
                          <div className="pf-muted">{h.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {r.tags && (
                  <div className="pf-tags" style={{ marginTop: 16 }}>
                    {r.tags.map((t) => (
                      <span key={t} className="pf-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="projects">
          <SectionHead index="03" title="Featured Projects & Architecture" />
          <PortfolioComponent
            items={portfolioProjects as PortfolioItem[]}
            templateId={3}
            theme="paper"
            autoplay
            showNav
          />
        </section>

        <footer className="pf-footer">
          <div>
            <span className="pf-label">Education</span>
            <div style={{ fontWeight: 500, marginTop: 12 }}>
              Bachelor of Fine Arts (B.F.A.)
            </div>
            <div className="pf-muted">
              School of the Art Institute of Chicago — Chicago, IL
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Portfolio;
