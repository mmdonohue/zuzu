import React, { useState, useEffect } from "react";
import { Icon } from '@iconify-icon/react';

const Portfolio: React.FC = () => {
  const [desertModalOpen, setDesertModalOpen] = useState(false);

  useEffect(() => {

    const tailwindCSS = document.createElement('link');
    tailwindCSS.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    tailwindCSS.rel = 'stylesheet';
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Patrick+Hand&family=Amatic+SC:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Lucide Icons
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = () => {
      // @ts-ignore
      if (window.lucide) {
        // @ts-ignore
        window.lucide.createIcons({
          attrs: {
            'stroke-width': 1.5
          }
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
    <div className="text-zinc-200 antialiased selection:text-indigo-200 relative min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Top Navigation */}
    `    <div className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/60 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto pl-6 h-16 flex items-center justify-between">
                <div className="text-zinc-100 font-normal text-lg tracking-[1em]">Matt Donohue</div>
                <nav className="hidden md:flex items-center gap-6 text-base font-normal text-zinc-200">
                    <a href="#about" className="hover:text-zinc-100 text-[#749eb4f0]">About</a>
                    <a href="#skills" className="hover:text-zinc-100 text-[#749eb4f0]">Expertise</a>
                    <a href="#experience" className="hover:text-zinc-100 text-[#749eb4f0]">Experience</a>
                    <a href="#projects" className="hover:text-zinc-100 text-[#749eb4f0]">Projects</a>
                </nav>
                <a href="mailto:donohue.matt@gmail.com" className="text-base font-normal text-zinc-100 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 px-4 py-2 rounded-full transition-colors border border-zinc-700/50">
                    Get in touch
                </a>
            </div>
        </div>`
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center" 
        style={{ backgroundImage: "url('/assets/img/foggy_coast.png')" }}
      ></div>
      
      {/* Glass/Dark Overlay */}
      <div className="fixed inset-0 z-[-1]"></div>

      {/* Desert Images Modal */}
      {desertModalOpen && (
        <div className="fixed top-0 right-0 bottom-20 z-50 flex items-center justify-end bg-[transparent]">
          <div className="relative max-w-2xl mr-8 p-4">
            <button 
              onClick={() => setDesertModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center text-zinc-200 hover:text-zinc-100 transition-colors z-10"
            >
              <span className="text-xl">×</span>
            </button>
            <div className="grid grid-cols-2 gap-4 opacity-75 transition-opacity duration-300">
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_2135.JPEG" alt="Desert Hot Springs View 1" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_2699.JPEG" alt="Desert Hot Springs View 2" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                <img src="/assets/img/desert_4776.JPEG" alt="Desert Hot Springs View 3" className="w-full h-full object-cover aspect-[4/3]" />
              </div>
              <div className="bg-[transparent] backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
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
      <main className="relative z-10 flex-grow max-w-8xl mx-auto pl-6 lg:pl-64 lg:pr-4 pt-16 pb-24 space-y-32">

        {/* Hero Section */}
        <section id="about" className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6992aa] border border-indigo-500/20 text-indigo-100 text-sm font-normal mb-8 backdrop-blur-sm">
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
            15+ years of experience building and operating mission-critical production systems. Expertise in distributed architecture, full-stack development, and technical leadership. Proven ability to deliver scalable platforms and drive measurable business outcomes.
          </p>

          {/* Contact & Social Links */}
          <div className="flex flex-wrap items-center gap-4 text-base font-normal">
            <a href="https://www.linkedin.com/in/matt-donohue-609b084/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700">
              <i data-lucide="user" className="w-5 h-5"></i>
              LinkedIn
            </a>
            <a href="https://github.com/mmdonohue" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700">
              <i data-lucide="code" className="w-5 h-5"></i>
              GitHub
            </a>
            <a href="mailto:donohue.matt@gmail.com" className="flex items-center gap-2 text-zinc-200 hover:text-zinc-100 transition-colors bg-zinc-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700">
              <i data-lucide="mail" className="w-5 h-5"></i>
              Email
            </a>
            <div 
              className="flex items-center gap-2 text-indiglo-300 px-4 py-2 cursor-pointer hover:text-indigo-200 transition-colors"
              onMouseEnter={() => setDesertModalOpen(true)}
              onMouseLeave={() => setDesertModalOpen(false)}
            >
              <i data-lucide="map-pin" className="w-5 h-5"></i>
              Desert Hot Springs, CA
            </div>
          </div>
        </section>

        {/* Core Strengths & Skills */}
        <section id="skills" className="space-y-10">
          <h3 className="text-1xl font-medium tracking-tight text-zinc-100">Technical Expertise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Skill Card 1 */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-xl pl-6 py-6 hover:bg-zinc-900/60 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-indigo-500/30 group-hover:text-indigo-200 transition-colors">
                <i data-lucide="layers" className="w-5 h-5"></i>
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
                <i data-lucide="server" className="w-5 h-5"></i>
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
                <i data-lucide="database" className="w-5 h-5"></i>
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
                <i data-lucide="cpu" className="w-5 h-5"></i>
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
                <i data-lucide="video" className="w-5 h-5"></i>
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
                <i data-lucide="shield-check" className="w-5 h-5"></i>
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


        {/* Experience Timeline */}
        <section id="experience" className="space-y-8 bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-6">
            <h3 className="text-2xl font-medium tracking-tight text-zinc-100">Experience</h3>
            
            <div className="relative border-l border-zinc-800/50 ml-3 md:ml-4 space-y-12 pb-4">
                
                {/* NBCUniversal */}
                <div className="relative pl-8 md:pl-10">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-800 ring-4 ring-zinc-950/50"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                        <h4 className="text-lg font-normal tracking-tight text-zinc-100">Senior Engineer / Solution Architect</h4>
                        <span className="text-base font-normal text-indiglo-300 md:ml-4">Feb 2022 – Apr 2025</span>
                    </div>
                    <div className="text-base font-normal text-indigo-200 mb-4">NBCUniversal</div>
                    
                    <ul className="space-y-3 text-base text-zinc-200 leading-relaxed mb-6">
                        <li className="flex items-start gap-2">
                            <i data-lucide="chevron-right" className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"></i>
                            <span>Architected distributed systems for large-scale rights management and live content protection workflows.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i data-lucide="chevron-right" className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"></i>
                            <span>Built cross-platform asset metadata sync across YouTube Content ID &amp; Facebook Rights Manager, reducing manual overhead by 50%+.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i data-lucide="chevron-right" className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"></i>
                            <span>Designed and operated live streaming infrastructure supporting 20+ concurrent streams with real-time monitoring.</span>
                        </li>
                    </ul>

                      {/* Achievements Box */}
                    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-lg p-4">
                        <h5 className="text-sm font-normal text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i data-lucide="trophy" className="w-4 h-4 text-amber-400"></i>
                            Major Highlights
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border-l-2 border-zinc-700/50 pl-3">
                                <div className="text-zinc-200 text-base font-normal">Olympics 2024 Operations</div>
                                <div className="text-sm text-indiglo-300 mt-1">70,000+ live fingerprints, 800+ IP sources, 99.9% accuracy. Supported partnership extension.</div>
                            </div>
                            <div className="border-l-2 border-zinc-700/50 pl-3">
                                <div className="text-zinc-200 text-base font-normal">Platform Optimization</div>
                                <div className="text-sm text-indiglo-300 mt-1">Reduced asset latency by 40%, achieved 100% delivery SLA within year one.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Netrix LLC */}
                <div className="relative pl-8 md:pl-10">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-indigo-200 ring-4 ring-zinc-950/50"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                        <h4 className="text-lg font-normal tracking-tight text-zinc-100">Senior Developer / Solution Architect</h4>
                        <span className="text-base font-normal text-indiglo-300 md:ml-4">2005 – 2022</span>
                    </div>
                    <div className="text-base font-normal text-indigo-200 mb-4">Netrix LLC</div>
                    
                    <ul className="space-y-3 text-base text-zinc-200 leading-relaxed mb-6">
                        <li className="flex items-start gap-2">
                            <i data-lucide="chevron-right" className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"></i>
                            <span>Built multi-cloud platform services across AWS, Azure, GCP, and VMware, supporting recurring revenue products.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i data-lucide="chevron-right" className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"></i>
                            <span>Designed Node.js middleware and Python/Flask services for secure API orchestration and long-running workflows.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i data-lucide="chevron-right" className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-600"></i>
                            <span>Led senior engineering team through major releases, owning architecture decisions and delivery execution.</span>
                        </li>
                    </ul>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded text-sm text-zinc-200">CloudHelm</span>
                        <span className="px-2 py-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded text-sm text-zinc-200">ERP/ETL Pipelines</span>
                        <span className="px-2 py-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded text-sm text-zinc-200">Rapidata (acquired by Nasdaq)</span>
                    </div>
                </div>

            </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="space-y-8">
          <h3 className="text-1xl font-medium tracking-tight text-zinc-100" style={{ fontWeight: 700}}>Featured Projects & Architecture</h3>
          
          <div className="space-y-6">
            {/* Project: Seravanna */}
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="pl-8 py-8 lg:pl-10 lg:py-10 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <i data-lucide="leaf" className="w-4 h-4"></i>
                    </div>
                    <h4 className="text-lg font-normal tracking-tight text-zinc-100" style={{ fontWeight: 700 }}>Seravanna – Wellness Services</h4>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">TypeScript</span>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Python</span>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Comprehensive wellness services framework featuring seamless booking workflows, intelligent chatbot integration, and complete administrative controls.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Fully integrated Stripe booking workflows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Multi-tenant design with Admin control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Meta Ads integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>RAG enabled HBOT chat bot using free LLM models</span>
                    </li>
                  </ul>

                  <div className="mb-6">
                    <a href="https://www.seravanna.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      <i data-lucide="globe" className="w-5 h-5"></i>
                      www.seravanna.com
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
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="pl-8 py-8 lg:pl-10 lg:py-10 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <i data-lucide="trending-up" className="w-4 h-4"></i>
                    </div>
                    <h4 className="text-lg font-normal tracking-tight text-zinc-100" style={{ fontWeight: 700 }}>Mahoraga-AHAB – Trading Bot</h4>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">TypeScript</span>
                    <span className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm font-normal text-zinc-300">Python</span>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Autonomous LLM-powered intraday trading bot named after the Jujutsu Kaisen mythical beast that adapts to every attack — the system is designed to do the same: learn from its own trade history and adjust behaviour in real-time.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>MCP Server exposing 40+ tools for trading, analysis, and risk management, yFianace integration, Automated signal gathering and sentiment scoring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Monitors positions with dynamic TP/SL, trailing stops, LLM re-analysis and trading performance via agents Entry/Exit Optimizer, Portfolio Manager and Trade Journal</span>
                    </li>
                  </ul>

                  <div>
                    <a href="mailto:donohue.matt@gmail.com?subject=Mahoraga Repo Request" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      <i data-lucide="lock" className="w-5 h-5"></i>
                      Repo on request
                    </a>
                  </div>
                </div>
                <div className="pl-4 pr-4 py-8 bg-zinc-950/40 flex flex-col items-center justify-center relative min-h-[300px]">
                  <div className="relative z-10 w-full h-full">
                    <img src="/assets/img/mahoraga_dash.png" alt="Mahoraga Dashboard" className="w-full object-cover rounded-xl shadow-2xl border border-zinc-800/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Project: ZuZu Scaffold */}
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="pl-8 py-8 lg:pl-10 lg:py-10 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-200 flex items-center justify-center text-indigo-200">
                      <i data-lucide="box" className="w-4 h-4"></i>
                    </div>
                    <h4 className="text-lg font-normal tracking-tight text-zinc-100" style={{ fontWeight: 700 }}>ZuZu Scaffold</h4>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Production-ready full-stack application scaffold focused on security, maintainability, and scalable team workflows. Built with React/TypeScript and Node/Express.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Production-grade auth (JWT, CSRF, rate limiting)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>AI-driven workflow automation hooks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Cypress E2E testing integrated</span>
                    </li>
                  </ul>

                  <div>
                    <a href="https://github.com/mmdonohue/zuzu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      <i data-lucide="code" className="w-5 h-5"></i>
                      View Repository
                    </a>
                    <a href="https://zuzu-frontend.onrender.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50">
                      <i data-lucide="external-link" className="w-5 h-5"></i>
                      Website
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

            {/* Project: Real-Time Rights Management */}
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="p-8 lg:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-emerald-200">
                      <i data-lucide="film" className="w-4 h-4"></i>
                    </div>
                    <h4 className="text-lg font-normal tracking-tight text-zinc-100" style={{ fontWeight: 700 }}>NBCUniversal: Real-Time Rights Management</h4>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    High-throughput distributed system for live content fingerprinting and rights enforcement across partner social video platforms.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Event-driven architecture using Apache Kafka</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>FFMPEG integration for live stream processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Zero-downtime deployment on Kubernetes and Docker Swarm</span>
                    </li>
                  </ul>

                  <div>
                    {/*
                    <button className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50 cursor-pointer">
                      <i data-lucide="network" className="w-5 h-5"></i>
                      View Architecture
                    </button>
                    */}
                  </div>
                </div>
                
                <div className="pl-4 pr-4 py-8 bg-zinc-950/40 flex flex-col items-center justify-center relative min-h-[300px]">
                  <div className="relative z-10 w-full h-full">
                    <img src="/assets/img/nbc_code_tree.png" alt="NBC Diagram" className="w-full h-full object-cover rounded-xl shadow-2xl border border-zinc-800/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Project: Multi-Cloud Orchestration Portal */}
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr]">
                <div className="p-8 lg:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <i data-lucide="cloud" className="w-4 h-4"></i>
                    </div>
                    <h4 className="text-lg font-normal tracking-tight text-zinc-100" style={{ fontWeight: 700 }}>Netrix Global: Multi-Cloud Orchestration Portal</h4>
                  </div>
                  <p className="text-base text-zinc-200 mb-6 leading-relaxed">
                    Enterprise dashboard for automated infrastructure provisioning, ETL pipeline monitoring, and billing analytics.
                  </p>
                  
                  <ul className="space-y-3 text-base text-zinc-200 mb-8">
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Seamless integration with managed VMSphere environment and cloud services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Next.js frontend with complex state management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Python/Airflow data pipelines for billing ETL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i data-lucide="check-circle" className="mt-0.5 w-5 h-5 text-emerald-500 flex-shrink-0"></i>
                      <span>Robust RBAC and Enterprise SSO integration</span>
                    </li>
                  </ul>

                  <div>
                    {/* 
                    <button className="inline-flex items-center gap-2 text-base font-normal text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors border border-zinc-700/50 cursor-pointer">
                      <i data-lucide="file-text" className="w-5 h-5"></i>
                      View Case Study
                    </button>
                    */}
                  </div>
                </div>
                
                <div className="pl-4 pr-4 py-8 bg-zinc-950/40 flex flex-col items-center justify-center relative min-h-[300px]">
                    {/* 5x4 Portfolio Canvas */}
                    <div className="w-full max-w-[800px] aspect-[5/4] bg-[#09090b] rounded-2xl border border-white/[0.06] flex flex-col overflow-hidden relative" style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                        
                        {/* Top Navigation */}
                        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-white/[0.01] relative z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-7 h-7 rounded border border-white/[0.12] bg-white/[0.05] flex items-center justify-center shadow-sm">
                                    <span className="text-xs font-semibold tracking-tighter text-white">O C</span>
                                </div>
                                <div className="h-4 w-[1px] bg-white/[0.1]"></div>
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors border border-transparent hover:border-white/[0.04]">
                                    <span className="text-sm font-medium text-neutral-300">OmniCorp Global</span>
                                    <Icon icon="solar:alt-arrow-down-linear" className="text-neutral-500" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors relative">
                                    <Icon icon="solar:bell-linear" />
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#09090b]"></div>
                                </button>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-600 border border-white/[0.1] p-[2px]">
                                    <div className="w-full h-full rounded-full bg-neutral-900 border border-white/[0.05]"></div>
                                </div>
                            </div>
                        </header>

                        {/* Main Orthographic Content */}
                        <main className="flex-1 relative overflow-hidden bg-neutral-950 flex items-center justify-center">
                            
                            {/* Floating Abstract UI: Top Left */}
                            <div className="absolute top-6 left-6 z-20 flex flex-col gap-1.5 pointer-events-none">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:layers-linear" className="text-neutral-400 text-lg" />
                                    <h2 className="text-sm font-medium text-white tracking-tight">Topology</h2>
                                </div>
                                <p className="text-xs text-neutral-500">Global Infrastructure Tree</p>
                            </div>

                            {/* Floating Abstract UI: Bottom Right Telemetry */}
                            <div className="absolute bottom-6 right-6 z-20 w-56 p-4 bg-[#09090b]/80 backdrop-blur-md border border-white/[0.04] rounded-xl flex flex-col gap-3 shadow-2xl">
                                <div className="flex items-center gap-2 text-xs font-medium text-white tracking-wide">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    OMNICORP NEXUS
                                </div>
                                <div className="h-[1px] w-full bg-white/[0.05]"></div>
                                <div className="flex flex-col gap-2 font-mono text-xs">
                                    <div className="flex justify-between items-center"><span className="text-neutral-500">AWS.EKS.east</span><span className="text-orange-400">SYNC</span></div>
                                    <div className="flex justify-between items-center"><span className="text-neutral-500">AZR.AKS.west</span><span className="text-blue-400">SYNC</span></div>
                                    <div className="flex justify-between items-center"><span className="text-neutral-500">GCP.GKE.cen</span><span className="text-red-400">SYNC</span></div>
                                    <div className="flex justify-between items-center"><span className="text-neutral-500">ONP.VMW.loc</span><span className="text-emerald-400">SYNC</span></div>
                                </div>
                            </div>

                            {/* 3D Canvas Perspective Container */}
                            <div className="relative w-full h-full flex items-center justify-center perspective-[2000px] scale-[0.6] sm:scale-[0.85] lg:scale-100 mt-8">
                                
                                {/* The Orthographic Plane */}
                                <div className="relative w-[800px] h-[800px]" style={{ transform: "rotateX(60deg) rotateZ(-45deg)", transformStyle: "preserve-3d" }}>
                                    
                                    {/* Isometric Grid Background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" style={{ maskImage: "radial-gradient(ellipse at 50% 50%, black 10%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 10%, transparent 75%)" }}></div>

                                    {/* Connecting Lines (Tree Topology) */}
                                    <svg width="800" height="800" className="absolute inset-0 z-0 pointer-events-none">
                                        {/* Org -> Project */}
                                        <path d="M 150 400 L 350 400" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="2"></path>
                                        <path d="M 150 400 L 350 400" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 16">
                                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.0s" repeatCount="indefinite"></animate>
                                        </path>

                                        {/* Project -> AWS */}
                                        <path d="M 350 400 L 600 200" fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth="2"></path>
                                        <path d="M 350 400 L 600 200" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 16">
                                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite"></animate>
                                        </path>
                                        {/* AWS Asset Spokelines */}
                                        <path d="M 600 200 L 600 155 M 600 200 L 645 200 M 600 200 L 600 245 M 600 200 L 555 200" stroke="rgba(249,115,22,0.25)" strokeWidth="1.5"></path>

                                        {/* Project -> Azure */}
                                        <path d="M 350 400 L 600 330" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="2"></path>
                                        <path d="M 350 400 L 600 330" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 16">
                                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.3s" repeatCount="indefinite"></animate>
                                        </path>
                                        {/* Azure Asset Spokelines */}
                                        <path d="M 600 330 L 600 285 M 600 330 L 645 330 M 600 330 L 600 375 M 600 330 L 555 330" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"></path>
                                        {/* Project -> GCP */}
                                        <path d="M 350 400 L 600 470" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="2"></path>
                                        <path d="M 350 400 L 600 470" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 16">
                                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.4s" repeatCount="indefinite"></animate>
                                        </path>
                                        {/* GCP Asset Spokelines */}
                                        <path d="M 600 470 L 600 425 M 600 470 L 645 470 M 600 470 L 600 515 M 600 470 L 555 470" stroke="rgba(239,68,68,0.25)" strokeWidth="1.5"></path>
                                        {/* Project -> Private DC */}
                                        <path d="M 350 400 L 600 600" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="2"></path>
                                        <path d="M 350 400 L 600 600" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 16">
                                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.5s" repeatCount="indefinite"></animate>
                                        </path>
                                        {/* Private DC Asset Spokelines */}
                                        <path d="M 600 600 L 600 555 M 600 600 L 645 600 M 600 600 L 600 645 M 600 600 L 555 600" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5"></path>
                                    </svg>

                                    {/* LEVEL 1: Org Node (150, 400) */}
                                    <div className="absolute left-[150px] top-[400px] w-24 h-24 -translate-x-1/2 -translate-y-1/2 z-10" style={{"transformStyle": "preserve-3d"}}>
                                        <div className="absolute inset-0 bg-violet-500/10 blur-2xl rounded-full"></div>
                                        <div className="absolute inset-0 bg-neutral-950 border border-violet-500/20 rounded-2xl"></div>
                                        <div className="absolute inset-2 bg-violet-500/5 border border-violet-500/30 rounded-xl flex items-center justify-center backdrop-blur-md" style={{"transform": "translateZ(16px)"}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-violet-400" style={{"transform": "translateZ(32px)"}}>
                                             <Icon icon="solar:global-linear" className="text-3xl" />
                                        </div>
                                        <div className="absolute top-[110%] left-1/2 -translate-x-1/2 text-center w-32" style={{"transform": "translateZ(0px)"}}>
                                            <span className="text-xs text-white font-semibold tracking-wide uppercase block">OmniCorp</span>
                                            <span className="text-[10px] text-neutral-500 tracking-widest uppercase block mt-0.5">Global Org</span>
                                        </div>
                                    </div>

                                    {/* LEVEL 2: Project Node (350, 400) */}
                                    <div className="absolute left-[350px] top-[400px] w-16 h-16 -translate-x-1/2 -translate-y-1/2 z-10" style={{"transformStyle": "preserve-3d"}}>
                                        <div className="absolute inset-0 bg-white/10 blur-xl rounded-full"></div>
                                        <div className="absolute inset-0 bg-neutral-950 border border-white/20 rounded-xl"></div>
                                        <div className="absolute inset-1.5 bg-white/5 border border-white/30 rounded-lg flex items-center justify-center backdrop-blur-md" style={{"transform": "translateZ(12px)"}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-white" style={{"transform": "translateZ(24px)"}}>
                                            <Icon icon="solar:cpu-linear" className="text-xl" />
                                        </div>
                                        <div className="absolute top-[110%] left-1/2 -translate-x-1/2 text-center w-32">
                                            <span className="text-xs text-neutral-200 font-medium tracking-wide uppercase block">Project Nexus</span>
                                        </div>
                                    </div>

                                    {/* LEVEL 3 & 4: Cloud Nodes with Asset Rings */}
                                    
                                    {/* AWS (600, 200) */}
                                    <div className="absolute left-[600px] top-[200px] w-12 h-12 -translate-x-1/2 -translate-y-1/2 z-10" style={{"transformStyle": "preserve-3d"}}>
                                        {/* Assets */}
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-orange-500/30 bg-neutral-950 flex items-center justify-center text-orange-400" style={{"transform": "translate(0, -45px) translateZ(8px)"}}><Icon icon="solar:database-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-orange-500/30 bg-neutral-950 flex items-center justify-center text-orange-400" style={{"transform": "translate(45px, 0) translateZ(8px)"}}><Icon icon="solar:server-square-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-orange-500/30 bg-neutral-950 flex items-center justify-center text-orange-400" style={{"transform": "translate(0, 45px) translateZ(8px)"}}><Icon icon="solar:shield-keyhole-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-orange-500/30 bg-neutral-950 flex items-center justify-center text-orange-400" style={{"transform": "translate(-45px, 0) translateZ(8px)"}}><Icon icon="solar:routing-3-linear" className="text-[10px]" /></div>
                                        {/* Core */}
                                        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                                        <div className="absolute inset-0 bg-neutral-950 border border-orange-500/30 rounded-lg"></div>
                                        <div className="absolute inset-1 bg-orange-500/10 border border-orange-500/40 rounded-md" style={{"transform": "translateZ(10px)"}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-orange-400" style={{"transform": "translateZ(20px)"}}><Icon icon="solar:cloud-linear" className="text-lg" /></div>
                                        <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 text-center w-24">
                                            <span className="text-[10px] text-neutral-300 font-medium tracking-widest uppercase block">AWS</span>
                                        </div>
                                    </div>

                                    {/* Azure (600, 330) */}
                                    <div className="absolute left-[600px] top-[330px] w-12 h-12 -translate-x-1/2 -translate-y-1/2 z-10" style={{"transformStyle": "preserve-3d"}}>
                                        {/* Assets */}
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-blue-500/30 bg-neutral-950 flex items-center justify-center text-blue-400" style={{"transform": "translate(0, -45px) translateZ(8px)"}}><Icon icon="solar:database-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-blue-500/30 bg-neutral-950 flex items-center justify-center text-blue-400" style={{"transform": "translate(45px, 0) translateZ(8px)"}}><Icon icon="solar:server-square-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-blue-500/30 bg-neutral-950 flex items-center justify-center text-blue-400" style={{"transform": "translate(0, 45px) translateZ(8px)"}}><Icon icon="solar:shield-keyhole-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-blue-500/30 bg-neutral-950 flex items-center justify-center text-blue-400" style={{"transform": "translate(-45px, 0) translateZ(8px)"}}><Icon icon="solar:routing-3-linear" className="text-[10px]" /></div>
                                        {/* Core */}
                                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                                        <div className="absolute inset-0 bg-neutral-950 border border-blue-500/30 rounded-lg"></div>
                                        <div className="absolute inset-1 bg-blue-500/10 border border-blue-500/40 rounded-md" style={{"transform": "translateZ(10px)"}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-blue-400" style={{"transform": "translateZ(20px)"}}><Icon icon="solar:server-path-linear" className="text-lg" /></div>
                                        <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 text-center w-24">
                                            <span className="text-[10px] text-neutral-300 font-medium tracking-widest uppercase block">Azure</span>
                                        </div>
                                    </div>

                                    {/* GCP (600, 470) */}
                                    <div className="absolute left-[600px] top-[470px] w-12 h-12 -translate-x-1/2 -translate-y-1/2 z-10" style={{"transformStyle": "preserve-3d"}}>
                                        {/* Assets */}
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-red-500/30 bg-neutral-950 flex items-center justify-center text-red-400" style={{"transform": "translate(0, -45px) translateZ(8px)"}}><Icon icon="solar:database-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-red-500/30 bg-neutral-950 flex items-center justify-center text-red-400" style={{"transform": "translate(45px, 0) translateZ(8px)"}}><Icon icon="solar:server-square-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-red-500/30 bg-neutral-950 flex items-center justify-center text-red-400" style={{"transform": "translate(0, 45px) translateZ(8px)"}}><Icon icon="solar:shield-keyhole-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-red-500/30 bg-neutral-950 flex items-center justify-center text-red-400" style={{"transform": "translate(-45px, 0) translateZ(8px)"}}><Icon icon="solar:routing-3-linear" className="text-[10px]" /></div>
                                        {/* Core */}
                                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                                        <div className="absolute inset-0 bg-neutral-950 border border-red-500/30 rounded-lg"></div>
                                        <div className="absolute inset-1 bg-red-500/10 border border-red-500/40 rounded-md" style={{"transform": "translateZ(10px)"}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-red-400" style={{"transform": "translateZ(20px)"}}><Icon icon="solar:chart-square-linear" className="text-lg" /></div>
                                        <div className="absolute top-[130%] left-1/2 -translate-x-1/2 text-center w-24">
                                            <span className="text-[10px] text-neutral-300 font-medium tracking-widest uppercase block">GCP</span>
                                        </div>
                                    </div>

                                    {/* Private Datacenter (600, 600) */}
                                    <div className="absolute left-[600px] top-[600px] w-12 h-12 -translate-x-1/2 -translate-y-1/2 z-10" style={{"transformStyle": "preserve-3d"}}>
                                        {/* Assets */}
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-emerald-500/30 bg-neutral-950 flex items-center justify-center text-emerald-400" style={{"transform": "translate(0, -45px) translateZ(8px)"}}><Icon icon="solar:database-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-emerald-500/30 bg-neutral-950 flex items-center justify-center text-emerald-400" style={{"transform": "translate(45px, 0) translateZ(8px)"}}><Icon icon="solar:server-square-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-emerald-500/30 bg-neutral-950 flex items-center justify-center text-emerald-400" style={{"transform": "translate(0, 45px) translateZ(8px)"}}><Icon icon="solar:shield-keyhole-linear" className="text-[10px]" /></div>
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-[4px] border border-emerald-500/30 bg-neutral-950 flex items-center justify-center text-emerald-400" style={{"transform": "translate(-45px, 0) translateZ(8px)"}}><Icon icon="solar:routing-3-linear" className="text-[10px]" /></div>
                                        {/* Core */}
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                                        <div className="absolute inset-0 bg-neutral-950 border border-emerald-500/30 rounded-lg"></div>
                                        <div className="absolute inset-1 bg-emerald-500/10 border border-emerald-500/40 rounded-md" style={{"transform": "translateZ(10px)"}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-emerald-400" style={{"transform": "translateZ(20px)"}}><Icon icon="solar:server-square-linear" className="text-lg" /></div>
                                        <div className="absolute top-[130%] left-1/2 -translate-x-1/2 text-center w-32">
                                            <span className="text-[10px] text-neutral-300 font-medium tracking-widest uppercase block">Private DC</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </main>
                    </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Footer / Education & Certs */}
        <footer className="pt-12 border-t border-zinc-800/50 grid grid-cols-1 md:grid-cols-2 gap-12 text-base">
          <div>
            <h4 className="font-normal text-lg tracking-tight text-zinc-100 mb-4 flex items-center gap-2">
              <i data-lucide="graduation-cap" className="w-5 h-5 text-indiglo-300"></i>
              Education
            </h4>
            <div className="text-zinc-300 font-normal">Bachelor of Fine Arts (B.F.A.)</div>
            <div className="text-indiglo-300">School of the Art Institute of Chicago — Chicago, IL</div>
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
