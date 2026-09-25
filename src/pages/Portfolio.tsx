import React, { useState, useEffect } from "react";
import PortfolioComponent from "../components/Portfolio";
import type { PortfolioItem } from "../components/Portfolio/types";
import portfolioProjects from "./portfolioProjects.json";

const Portfolio: React.FC = () => {
  const [desertModalOpen, setDesertModalOpen] = useState(false);

  useEffect(() => {
    const tailwindCSS = document.createElement("link");
    tailwindCSS.href =
      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
    tailwindCSS.rel = "stylesheet";
    // Load Google Fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Patrick+Hand&family=Amatic+SC:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Load Lucide Icons
    const script = document.createElement("script");
    script.src = "https://unpkg.com/lucide@latest";
    script.onload = () => {
      // @ts-ignore
      if (window.lucide) {
        // @ts-ignore
        window.lucide.createIcons({
          attrs: {
            "stroke-width": 1.5,
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      className="text-zinc-200 antialiased selection:text-indigo-200 relative min-h-screen flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Navigation */}`{" "}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto pl-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-zinc-500 hover:text-zinc-300 text-xs tracking-widest uppercase transition-colors"
            >
              ← ZuZu
            </a>
            <div className="text-zinc-100 font-normal text-lg tracking-[1em]">
              Matt Donohue
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-base font-normal text-zinc-200">
            <a href="#about" className="hover:text-zinc-100 text-[#749eb4f0]">
              About
            </a>
            <a href="#skills" className="hover:text-zinc-100 text-[#749eb4f0]">
              Expertise
            </a>
            <a
              href="#experience"
              className="hover:text-zinc-100 text-[#749eb4f0]"
            >
              Experience
            </a>
            <a
              href="#projects"
              className="hover:text-zinc-100 text-[#749eb4f0]"
            >
              Projects
            </a>
          </nav>
          <a
            href="mailto:donohue.matt@gmail.com"
            className="text-base font-normal text-zinc-100 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 px-4 py-2 rounded-full transition-colors border border-zinc-700/50"
          >
            Get in touch
          </a>
        </div>
      </div>
      `{/* Fixed Background Image backgroundImage: "url('/assets/img/foggy_coast.png')" */}
      <div
        className="fixed inset-0 z-[-2] bg-cover bg-center"
        style={{ backgroundColor: "#7b9eb4" }}
      ></div>
      {/* Glass/Dark Overlay */}
      <div className="fixed inset-0 z-[-1]"></div>
      {/* Desert Images Modal */}
      {desertModalOpen && (
        <div className="fixed top-0 right-0 bottom-10 z-50 flex items-center bg-[transparent]">
          <div className="relative max-w-2xl mr-8 p-12">
            <button
              onClick={() => setDesertModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center text-zinc-200 hover:text-zinc-100 transition-colors z-10"
            >
              <span className="text-xl">×</span>
            </button>
            <div className="grid grid-cols-2 gap-4 opacity-75 transition-opacity duration-300">
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img
                  src="/assets/img/desert_2135.JPEG"
                  alt="Desert Hot Springs View 1"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img
                  src="/assets/img/desert_2699.JPEG"
                  alt="Desert Hot Springs View 2"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img
                  src="/assets/img/desert_4776.JPEG"
                  alt="Desert Hot Springs View 3"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img
                  src="/assets/img/desert_3993.JPEG"
                  alt="Desert Hot Springs View 4"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fixed Profile ASCII Art */}
      <div className="hidden lg:block bg-[#333e45] fixed left-6 top-24 z-40">
        <img
          src="/assets/img/profile_ascii.png"
          alt="Matthew Donohue ASCII Portrait"
          className="w-48 backdrop-blur-md p-3 shadow-2xl hover:border-zinc-700/70 transition-all"
        />
      </div>
      {/* Main Content */}
      <main className="relative z-10 flex-grow max-w-8xl mx-auto pl-6 lg:pl-64 lg:pr-4 pt-16 pb-24 space-y-32">
        {/* Hero Section */}
        <section id="about" className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34424a] border border-indigo-500/20 text-indigo-100 text-sm font-normal mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3acbf0]"></span>
            </span>
            Available for new opportunities
          </div>
          {/* 
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-zinc-100 mb-6 bg-gradient-to-br from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
            Matt Donohue
          </h1>
            */}
          <h2 className="text-xl md:text-2xl font-normal tracking-tight text-zinc-300 mb-6">
            Senior Software Engineer & Solution Architect
          </h2>

          <p className="text-lg md:text-lg leading-relaxed text-zinc-200 mb-10 max-w-2xl">
            15+ years of experience building and operating mission-critical
            production systems. Expertise in distributed architecture,
            full-stack development, and technical leadership. Proven ability to
            deliver scalable platforms and drive measurable business outcomes.
          </p>

          {/* Contact & Social Links */}
          <div
            className="flex flex-wrap items-center gap-4 text-base font-normal"
            style={{ minHeight: 100 }}
          >
            <a
              href="https://www.linkedin.com/in/matt-donohue-609b084/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700"
            >
              <i data-lucide="user" className="w-5 h-5"></i>
              LinkedIn
            </a>
            <a
              href="https://github.com/mmdonohue"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700"
            >
              <i data-lucide="code" className="w-5 h-5"></i>
              GitHub
            </a>
            <a
              href="mailto:donohue.matt@gmail.com"
              className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700"
            >
              <i data-lucide="mail" className="w-5 h-5"></i>
              Email
            </a>
            <div
              className="flex items-center gap-2 text-indiglo-300 px-4 py-2 cursor-pointer hover:text-indigo-200 transition-colors"
              onClick={() => setDesertModalOpen(true)}
              onMouseEnter={() => setDesertModalOpen(true)}
              onMouseLeave={() => setDesertModalOpen(false)}
            >
              <i data-lucide="map-pin" className="w-5 h-5"></i>
              Desert Hot Springs, CA
            </div>
          </div>
        </section>

        {/* Core Strengths & Skills */}
        <section id="skills" className="space-y-5">
          <h3 className="text-1xl font-medium tracking-tight text-zinc-100">
            Technical Expertise
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Skill Card 1 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-indigo-500/30 group-hover:text-indigo-200 transition-colors">
                <i data-lucide="layers" className="w-5 h-5"></i>
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">
                Full-Stack Architecture
              </h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">
                React, Next.js, TypeScript, MUI, Tailwind CSS, Node.js, Express,
                Python Flask/FastAPI.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  React
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  TypeScript
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Node.js
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Flask
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  FastAPI
                </span>
              </div>
            </div>

            {/* Skill Card 2 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-emerald-500/30 group-hover:text-emerald-200 transition-colors">
                <i data-lucide="server" className="w-5 h-5"></i>
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">
                Distributed Systems
              </h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">
                Microservices, Event-Driven Messaging, High-throughput data
                services.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Kafka
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  RabbitMQ
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  AWS/GCP
                </span>
              </div>
            </div>

            {/* Skill Card 3 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-blue-500/30 group-hover:text-blue-200 transition-colors">
                <i data-lucide="database" className="w-5 h-5"></i>
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">
                Data & ML Operations
              </h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">
                Airflow, PostgreSQL, MongoDB, Redis, Python/Pandas, Jupyter.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  PostgreSQL
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Airflow
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Python
                </span>
              </div>
            </div>

            {/* Skill Card 4 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-amber-500/30 group-hover:text-amber-200 transition-colors">
                <i data-lucide="cpu" className="w-5 h-5"></i>
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">
                AI & Automation
              </h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">
                LLM integration, agent-based workflows, AI-assisted code review
                pipelines.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  LLM Inference
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Automation
                </span>
              </div>
            </div>

            {/* Skill Card 5 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-rose-500/30 group-hover:text-rose-200 transition-colors">
                <i data-lucide="video" className="w-5 h-5"></i>
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">
                Streaming & Media
              </h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">
                High-volume live streaming workflows, asset metadata sync,
                fingerprinting.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  FFMPEG
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  HLS
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  RTMP
                </span>
              </div>
            </div>

            {/* Skill Card 6 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-cyan-500/30 group-hover:text-cyan-200 transition-colors">
                <i data-lucide="shield-check" className="w-5 h-5"></i>
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">
                DevOps & Reliability
              </h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">
                Docker, Kubernetes, CI/CD, Observability, and Production
                Optimization.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Kubernetes
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  Docker
                </span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">
                  CI/CD
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Timeline */}
        <section
          id="experience"
          className="space-y-8 bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-6"
        >
          <h3 className="text-2xl font-medium tracking-tight text-zinc-100">
            Experience
          </h3>

          <div className="relative border-l border-zinc-800/50 ml-3 md:ml-4 space-y-12 pb-4">
            {/* NBCUniversal */}
            <div className="relative pl-8 md:pl-10">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-800 ring-4 ring-zinc-950/50"></div>

              <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                <h4 className="text-lg font-normal tracking-tight text-zinc-100">
                  Senior Engineer / Solution Architect
                </h4>
                <span className="text-base font-normal text-indiglo-300 md:ml-4">
                  Feb 2022 – Apr 2025
                </span>
              </div>
              <div className="text-base font-normal text-indigo-200 mb-4">
                NBCUniversal
              </div>

              <ul className="space-y-3 text-base text-zinc-200 leading-relaxed mb-6">
                <li className="flex items-start gap-2">
                  <i
                    data-lucide="chevron-right"
                    className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"
                  ></i>
                  <span>
                    Architected distributed systems for large-scale rights
                    management and live content protection workflows.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i
                    data-lucide="chevron-right"
                    className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"
                  ></i>
                  <span>
                    Built cross-platform asset metadata sync across YouTube
                    Content ID &amp; Facebook Rights Manager, reducing manual
                    overhead by 50%+.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i
                    data-lucide="chevron-right"
                    className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"
                  ></i>
                  <span>
                    Designed and operated live streaming infrastructure
                    supporting 20+ concurrent streams with real-time monitoring.
                  </span>
                </li>
              </ul>

              {/* Achievements Box */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-lg p-4">
                <h5 className="text-sm font-normal text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i
                    data-lucide="trophy"
                    className="w-4 h-4 text-amber-400"
                  ></i>
                  Major Highlights
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-l-2 border-zinc-700/50 pl-3">
                    <div className="text-zinc-200 text-base font-normal">
                      Olympics 2024 Operations
                    </div>
                    <div className="text-sm text-indiglo-300 mt-1">
                      70,000+ live fingerprints, 800+ IP sources, 99.9%
                      accuracy. Supported partnership extension.
                    </div>
                  </div>
                  <div className="border-l-2 border-zinc-700/50 pl-3">
                    <div className="text-zinc-200 text-base font-normal">
                      Platform Optimization
                    </div>
                    <div className="text-sm text-indiglo-300 mt-1">
                      Reduced asset latency by 40%, achieved 100% delivery SLA
                      within year one.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Netrix LLC */}
            <div className="relative pl-8 md:pl-10">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-indigo-200 ring-4 ring-zinc-950/50"></div>

              <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                <h4 className="text-lg font-normal tracking-tight text-zinc-100">
                  Senior Developer / Solution Architect
                </h4>
                <span className="text-base font-normal text-indiglo-300 md:ml-4">
                  2005 – 2022
                </span>
              </div>
              <div className="text-base font-normal text-indigo-200 mb-4">
                Netrix LLC
              </div>

              <ul className="space-y-3 text-base text-zinc-200 leading-relaxed mb-6">
                <li className="flex items-start gap-2">
                  <i
                    data-lucide="chevron-right"
                    className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"
                  ></i>
                  <span>
                    Built multi-cloud platform services across AWS, Azure, GCP,
                    and VMware, supporting recurring revenue products.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i
                    data-lucide="chevron-right"
                    className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"
                  ></i>
                  <span>
                    Designed Node.js middleware and Python/Flask services for
                    secure API orchestration and long-running workflows.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i
                    data-lucide="chevron-right"
                    className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"
                  ></i>
                  <span>
                    Led senior engineering team through major releases, owning
                    architecture decisions and delivery execution.
                  </span>
                </li>
              </ul>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded text-sm text-zinc-200">
                  CloudHelm
                </span>
                <span className="px-2 py-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded text-sm text-zinc-200">
                  ERP/ETL Pipelines
                </span>
                <span className="px-2 py-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded text-sm text-zinc-200">
                  Rapidata (acquired by Nasdaq)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="space-y-8">
          <h3
            className="text-1xl font-medium tracking-tight text-zinc-100"
            style={{ fontWeight: 700 }}
          >
            Featured Projects & Architecture
          </h3>

          <PortfolioComponent
            items={portfolioProjects as PortfolioItem[]}
            templateId={3}
            autoplay
            showNav
          />
        </section>

        {/* Footer / Education & Certs */}
        <footer className="pt-12 border-t border-zinc-800/50 grid grid-cols-1 md:grid-cols-2 gap-12 text-base">
          <div>
            <h4 className="font-normal text-lg tracking-tight text-zinc-100 mb-4 flex items-center gap-2">
              <i
                data-lucide="graduation-cap"
                className="w-5 h-5 text-indiglo-300"
              ></i>
              Education
            </h4>
            <div className="text-zinc-300 font-normal">
              Bachelor of Fine Arts (B.F.A.)
            </div>
            <div className="text-indiglo-300">
              School of the Art Institute of Chicago — Chicago, IL
            </div>
          </div>
          <div>
            <h4 className="font-normal text-lg tracking-tight text-zinc-100 mb-4 flex items-center gap-2">
              <i data-lucide="award" className="w-5 h-5 text-indiglo-300"></i>
              Certifications
            </h4>
            <ul className="space-y-2 text-zinc-200">
              <li>AWS Cloud Technical Essentials</li>
              <li>IBM Machine Learning with Python</li>
              <li>Building Modern Node.js Applications on AWS</li>
              <li>Google Analytics</li>
            </ul>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Portfolio;
