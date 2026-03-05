import React, { useState, useEffect } from "react";

const Portfolio: React.FC = () => {
  const [desertModalOpen, setDesertModalOpen] = useState(false);

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Patrick+Hand&family=Amatic+SC:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="text-zinc-200 antialiased selection:text-indigo-200 relative min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center" 
        style={{ backgroundImage: "url('/assets/img/foggy_coast.png')" }}
      ></div>
      
      {/* Glass/Dark Overlay */}
      <div className="fixed inset-0 z-[-1]"></div>

      {/* Desert Images Modal */}
      {desertModalOpen && (
        <div className="fixed top-0 right-0 bottom-0 z-50 flex items-center justify-end bg-[transparent]">
          <div className="relative max-w-3xl mr-8 p-8">
            <button 
              onClick={() => setDesertModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center text-zinc-200 hover:text-zinc-100 transition-colors z-10"
            >
              <span className="text-xl">×</span>
            </button>
            <div className="grid grid-cols-2 gap-4 opacity-75 transition-opacity duration-300">
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_2135.JPEG" alt="Desert Hot Springs View 1" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_2699.JPEG" alt="Desert Hot Springs View 2" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_4776.JPEG" alt="Desert Hot Springs View 3" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_3993.JPEG" alt="Desert Hot Springs View 4" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Profile ASCII Art */}
      <div className="hidden lg:block bg-[#7aa5ba87] fixed left-6 top-24 z-40">
        <img src="/assets/img/profile_ascii.png" alt="Matthew Donohue ASCII Portrait" className="w-48 backdrop-blur-md p-3 shadow-2xl hover:border-zinc-700/70 transition-all" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-grow max-w-8xl mx-auto pl-6 lg:pl-64 lg:pr-4 pt-32 pb-24 space-y-32">

        {/* Hero Section */}
        <section id="about" className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6992aa] border border-indigo-500/20 text-indigo-100 text-sm font-normal mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3acbf0]"></span>
            </span>
            Available for new opportunities
          </div>
          
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-zinc-100 mb-6 bg-gradient-to-br from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
            Matt Donohue
          </h1>
          <h2 className="text-xl md:text-2xl font-normal tracking-tight text-zinc-300 mb-6">
            Senior Software Engineer & Solution Architect
          </h2>
          
          <p className="text-lg md:text-xl leading-relaxed text-zinc-200 mb-10 max-w-2xl">
            15+ years of experience building and operating mission-critical production systems. Expertise in distributed architecture, full-stack development, and technical leadership. Proven ability to deliver scalable platforms and drive measurable business outcomes.
          </p>

          {/* Contact & Social Links */}
          <div className="flex flex-wrap items-center gap-4 text-base font-normal">
            <a href="https://www.linkedin.com/in/matt-donohue-609b084/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700">
              LinkedIn
            </a>
            <a href="https://github.com/mmdonohue" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700">
              GitHub
            </a>
            <a href="mailto:donohue.matt@gmail.com" className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700">
              Email
            </a>
            <div 
              className="flex items-center gap-2 text-indiglo-300 px-4 py-2 cursor-pointer hover:text-indigo-200 transition-colors"
              onMouseEnter={() => setDesertModalOpen(true)}
              onMouseLeave={() => setDesertModalOpen(false)}
            >
              📍 Desert Hot Springs, CA
            </div>
          </div>
        </section>

        {/* Core Strengths & Skills */}
        <section id="skills" className="space-y-8">
          <h3 className="text-2xl font-medium tracking-tight text-zinc-100">Technical Expertise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Skill Card 1 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-indigo-500/30 group-hover:text-indigo-200 transition-colors">
                📊
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">Full-Stack Architecture</h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">React, Next.js, TypeScript, MUI, Tailwind CSS, Node.js, Express, Python Flask/FastAPI.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">React</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">TypeScript</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Node.js</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Flask</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">FastAPI</span>
              </div>
            </div>

            {/* Skill Card 2 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-emerald-500/30 group-hover:text-emerald-200 transition-colors">
                🖥️
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">Distributed Systems</h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">Microservices, Event-Driven Messaging, High-throughput data services.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Kafka</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">RabbitMQ</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">AWS/GCP</span>
              </div>
            </div>

            {/* Skill Card 3 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-blue-500/30 group-hover:text-blue-200 transition-colors">
                💾
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">Data & ML Operations</h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">Airflow, PostgreSQL, MongoDB, Redis, Python/Pandas, Jupyter.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">PostgreSQL</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Airflow</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Python</span>
              </div>
            </div>

            {/* Skill Card 4 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-amber-500/30 group-hover:text-amber-200 transition-colors">
                🤖
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">AI & Automation</h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">LLM integration, agent-based workflows, AI-assisted code review pipelines.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">LLM Inference</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Automation</span>
              </div>
            </div>

            {/* Skill Card 5 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-rose-500/30 group-hover:text-rose-200 transition-colors">
                🎬
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">Streaming & Media</h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">High-volume live streaming workflows, asset metadata sync, fingerprinting.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">FFMPEG</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">HLS</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">RTMP</span>
              </div>
            </div>

            {/* Skill Card 6 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-cyan-500/30 group-hover:text-cyan-200 transition-colors">
                🛡️
              </div>
              <h4 className="text-zinc-100 text-lg font-normal tracking-tight mb-2">DevOps & Reliability</h4>
              <p className="text-base text-zinc-200 mb-4 leading-relaxed">Docker, Kubernetes, CI/CD, Observability, and Production Optimization.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Kubernetes</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Docker</span>
                <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">CI/CD</span>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="space-y-8">
          <h3 className="text-2xl font-medium tracking-tight text-zinc-100" style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "2rem" }}>Featured Projects & Architecture</h3>
          
          <div className="space-y-6">
            {/* Project: Seravanna */}
            <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="pl-8 py-8 lg:pl-10 lg:py-10 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h4 className="text-xl font-normal tracking-tight text-zinc-100" style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "1.75rem" }}>Seravanna – Wellness Services</h4>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">TypeScript</span>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Python</span>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Comprehensive wellness services framework featuring seamless booking workflows, intelligent chatbot integration, and complete administrative controls.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>Fully integrated Stripe booking workflows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>Multi-tenant design with Admin control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>Meta Ads integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>RAG enabled HBOT chat bot using free LLM models</span>
                    </li>
                  </ul>

                  <div className="mb-6">
                    <a href="https://www.seravanna.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      🌐 www.seravanna.com
                    </a>
                  </div>
                </div>
                <div className="pl-4 pr-4 py-8 bg-zinc-950/40 flex flex-col items-center justify-center relative min-h-[300px]">
                  <div className="relative z-10 w-full h-full">
                    <img src="/assets/img/seravanna_site.png" alt="Seravanna Platform Interface" className="w-full h-full object-cover rounded-xl shadow-2xl border border-zinc-800/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Project: Mahoraga */}
            <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="pl-8 py-8 lg:pl-10 lg:py-10 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h4 className="text-xl font-normal tracking-tight text-zinc-100" style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "1.75rem" }}>Mahoraga – Trading Bot</h4>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">TypeScript</span>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Python</span>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Cloudflare Workers-based algorithmic trading bot featuring a comprehensive MCP server, real-time React dashboard, and strict automated safety layers.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>MCP Server exposing 40+ tools for trading, analysis, and risk management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>Two-phase order execution with policy engine validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>React dashboard polling real-time status every 5 seconds</span>
                    </li>
                  </ul>

                  <div>
                    <a href="mailto:donohue.matt@gmail.com?subject=Mahoraga Repo Request" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      🔒 Repo on request
                    </a>
                  </div>
                </div>
                <div className="pl-4 pr-4 py-8 bg-zinc-950/40 flex flex-col items-center justify-center relative min-h-[300px]">
                  <div className="relative z-10 w-full h-full">
                    <img src="/assets/img/mahoraga_dash.png" alt="Mahoraga Dashboard" className="w-full h-full object-cover rounded-xl shadow-2xl border border-zinc-800/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Project: ZuZu Scaffold */}
            <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="pl-8 py-8 lg:pl-10 lg:py-10 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-xl font-normal tracking-tight text-zinc-100" style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "1.75rem" }}>ZuZu Scaffold</h4>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Production-ready full-stack application scaffold focused on security, maintainability, and scalable team workflows. Built with React/TypeScript and Node/Express.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>Production-grade auth (JWT, CSRF, rate limiting)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>AI-driven workflow automation hooks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                      <span>Cypress E2E testing integrated</span>
                    </li>
                  </ul>

                  <div>
                    <a href="https://github.com/mmdonohue/zuzu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      📦 View Repository
                    </a>
                  </div>
                </div>
                <div className="pl-4 pr-4 py-8 bg-zinc-950/40 flex flex-col items-center justify-center relative min-h-[300px]">
                  <div className="relative z-10 w-full h-full">
                    <img src="/assets/img/zuzu_splash.png" alt="ZuZu Scaffold" className="w-full h-full object-cover rounded-xl shadow-2xl border border-zinc-800/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Portfolio;
