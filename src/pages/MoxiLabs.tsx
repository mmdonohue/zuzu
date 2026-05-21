import React, { useEffect } from "react";
import { Icon } from '@iconify-icon/react';

const BG_IMAGE_URL = "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/variants/f27d997b-82cd-4784-b79b-449c5d13aa67/3840w.png";

const CUSTOM_STYLES = `
  a { color: inherit; }
  .text-azure-500 { color: #bcf1fe !important; }
  .text-azure-800 { color: #6ce6faad !important; }
  .text-azure-dark { color: #74e5ff !important; }
  .bg-grid {
    background-size: 3rem 3rem;
    background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  }
  .mask-radial {
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  }
  .perspective-container { perspective: 1000px; }
  .iso-scene {
    transform: rotateX(60deg) rotateZ(-45deg);
    transform-style: preserve-3d;
  }
  .iso-layer {
    transform-style: preserve-3d;
    box-shadow: -24px 24px 32px rgba(0,0,0,0.6);
  }
  @keyframes float-1 {
    0%, 100% { transform: translateZ(0px); }
    50% { transform: translateZ(6px); }
  }
  @keyframes float-2 {
    0%, 100% { transform: translateZ(55px); }
    50% { transform: translateZ(65px); }
  }
  @keyframes float-3 {
    0%, 100% { transform: translateZ(110px); }
    50% { transform: translateZ(124px); }
  }
  .iso-layer-1 { animation: float-1 6s ease-in-out infinite; }
  .iso-layer-2 { animation: float-2 6s ease-in-out infinite 0.2s; }
  .iso-layer-3 { animation: float-3 6s ease-in-out infinite 0.4s; }
`;

const MoxiLabs: React.FC = () => {
  useEffect(() => {
    const tailwind = document.createElement('script');
    tailwind.src = 'https://cdn.tailwindcss.com';
    tailwind.id = 'moxilabs-tailwind-cdn';
    document.head.appendChild(tailwind);

    const fonts = document.createElement('link');
    fonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
    fonts.rel = 'stylesheet';
    fonts.id = 'moxilabs-fonts';
    document.head.appendChild(fonts);

    return () => {
      document.getElementById('moxilabs-tailwind-cdn')?.remove();
      document.getElementById('moxilabs-fonts')?.remove();
    };
  }, []);

  const maskStyle = 'linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)';

  return (
    <div
      className="antialiased scroll-smooth relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", color: '#bcf1fe' }}
    >
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />

      {/* Background Image */}
      <div
        className="fixed top-0 w-full h-screen bg-cover bg-center -z-10"
        id="aura-image" 
        style={{
          backgroundImage: `url("${BG_IMAGE_URL}")`,
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle,
        }}
      />

      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
        <div className="absolute inset-0 bg-grid mask-radial" />
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-zinc-950/50 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full border-b border-white/[0.05] bg-zinc-950/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-zinc-100 font-medium tracking-tighter text-4xl uppercase">MOXI LABS AI</span>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-azure-800">
            <a href="#approach" className="hover:text-zinc-100 transition-colors">Approach</a>
            <a href="#services" className="hover:text-zinc-100 transition-colors">Services</a>
            <a href="#clients" className="hover:text-zinc-100 transition-colors">Clients</a>
          </div>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200/90 h-9 px-4 py-2"
          >
            Get an Audit
          </a>
        </div>
      </nav>

      <main className="relative z-10 flex-grow">

        {/* Hero Section */}
        <section className="md:pt-48 md:pb-32 pt-32 pr-6 pb-24 pl-6">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-zinc-400 mr-2" />
              Practical AI &amp; Automation
            </div>
            <h1 className="text-4xl md:text-6xl font-medium tracking-tighter text-azure-800 leading-tight mb-6 max-w-3xl">
              Operational modernization without the technical overwhelm.
            </h1>
            <p className="text-base md:text-lg mb-10 max-w-2xl leading-relaxed text-azure-500">
              We help small and medium-sized businesses modernize repetitive processes using practical, approachable technology. Streamline workflows, simplify communication, and scale efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200/40 h-10 px-6 py-2"
              >
                Start with a Workflow Audit
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white/[0.05] hover:bg-zinc-900 hover:text-zinc-100 h-10 px-6 py-2 text-white"
                style={{ border: '1px solid white' }}
              >
                Explore Capabilities
              </a>
            </div>
          </div>
        </section>

        {/* Philosophy / Approach Section */}
        <section id="approach" className="py-24 px-6 border-y border-white/[0.02] bg-zinc-950/20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-24 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="max-w-xl w-full">
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-100 mb-4">Beyond the Hype</h2>
                <p className="text-base text-azure-500">
                  We operate with a strong bias toward practical outcomes. No abstract innovation consulting—just real business systems that save time and reduce manual overhead.
                </p>
              </div>

              {/* Isometric Methodology Graphic */}
              <div className="hidden md:flex relative w-full max-w-[320px] h-72 perspective-container items-center justify-center">
                <div className="absolute inset-0 bg-white/[0.01] blur-3xl rounded-full" />
                <div className="iso-scene relative w-48 h-48">

                  {/* Layer 1: Data / Base */}
                  <div className="iso-layer iso-layer-1 absolute inset-0 rounded-2xl border border-white/[0.05] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/[0.02]" />
                    <Icon icon="solar:database-linear" width={28} height={28} className="text-zinc-600 mb-2" />
                    <span className="absolute bottom-3 left-4 text-xs font-medium tracking-widest text-zinc-600 uppercase">01 / Data</span>
                  </div>

                  {/* Layer 2: Logic / AI */}
                  <div className="iso-layer iso-layer-2 absolute inset-0 rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-md flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/[0.04]" />
                    <Icon icon="solar:cpu-linear" width={32} height={32} className="text-azure-500 mb-2" />
                    <span className="absolute bottom-3 left-4 text-xs font-medium tracking-widest text-zinc-500 uppercase">02 / Logic</span>
                  </div>

                  {/* Layer 3: Business Outcome */}
                  <div className="iso-layer iso-layer-3 absolute inset-0 rounded-2xl border border-zinc-200/20 bg-zinc-800/40 backdrop-blur-lg flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/[0.08]" />
                    <Icon icon="solar:rocket-linear" width={36} height={36} className="text-zinc-100 mb-2" />
                    <span className="absolute bottom-3 left-4 text-xs font-medium tracking-widest text-zinc-300 uppercase">03 / Output</span>
                  </div>

                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.05] hover:bg-white/[0.02] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-300">
                  <Icon icon="solar:share-circle-linear" width={20} height={20} />
                </div>
                <h3 className="text-lg font-medium tracking-tight text-zinc-100 mb-2">Systems Thinking</h3>
                <p className="text-sm text-azure-500 leading-relaxed">
                  We treat businesses as interconnected operational systems rather than isolated software problems. We focus on process flow, communication bottlenecks, and data visibility.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.05] hover:bg-white/[0.02] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-300">
                  <Icon icon="solar:code-square-linear" width={20} height={20} />
                </div>
                <h3 className="text-lg font-medium tracking-tight text-zinc-100 mb-2">Technical Depth</h3>
                <p className="text-sm text-azure-500 leading-relaxed">
                  Unlike generic agencies, we possess actual software engineering architecture capabilities. This enables secure integrations, scalable internal tooling, and custom data processing.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.05] hover:bg-white/[0.02] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-300">
                  <Icon icon="solar:hand-shake-linear" width={20} height={20} />
                </div>
                <h3 className="text-lg font-medium tracking-tight text-zinc-100 mb-2">The Translation Layer</h3>
                <p className="text-sm text-azure-500 leading-relaxed">
                  We bridge business operations and complex technical systems without overwhelming non-technical staff. We translate automation capabilities into understandable business outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-100 mb-4">Core Capabilities</h2>
              <p className="text-base text-azure-500">
                Comprehensive operational modernization tailored for service-based businesses.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="group relative p-6 rounded-2xl border border-white/[0.05] bg-zinc-950 hover:border-zinc-700 transition-all overflow-hidden flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <Icon icon="solar:clipboard-list-linear" width={24} height={24} className="text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium tracking-tight text-zinc-100 mb-2">AI Workflow Audits</h3>
                  <p className="text-sm text-azure-500 mb-6 flex-grow">Operational reviews focused on identifying repetitive tasks, manual bottlenecks, and automation opportunities.</p>
                  <ul className="text-xs text-zinc-500 space-y-2">
                    <li className="flex items-center gap-2"><Icon icon="solar:check-circle-linear" className="text-azure-500" /> Process mapping</li>
                    <li className="flex items-center gap-2"><Icon icon="solar:check-circle-linear" className="text-azure-500" /> Inefficiency identification</li>
                  </ul>
                </div>
              </div>

              <div className="group relative p-6 rounded-2xl border border-white/[0.05] bg-zinc-950 hover:border-zinc-700 transition-all overflow-hidden flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <Icon icon="solar:routing-2-linear" width={24} height={24} className="text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium tracking-tight text-zinc-100 mb-2">Business Automation</h3>
                  <p className="text-sm text-azure-500 mb-6 flex-grow">Implementation of workflow automation, operational integrations, and CRM synchronization.</p>
                  <ul className="text-xs text-zinc-500 space-y-2">
                    <li className="flex items-center gap-2"><Icon icon="solar:check-circle-linear" className="text-azure-500" /> Lead routing systems</li>
                    <li className="flex items-center gap-2"><Icon icon="solar:check-circle-linear" className="text-azure-500" /> Scheduling automation</li>
                  </ul>
                </div>
              </div>

              <div className="group relative p-6 rounded-2xl border border-white/[0.05] bg-zinc-950 hover:border-zinc-700 transition-all overflow-hidden flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <Icon icon="solar:cpu-linear" width={24} height={24} className="text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium tracking-tight text-zinc-100 mb-2">AI Integration</h3>
                  <p className="text-sm text-azure-500 mb-6 flex-grow">Practical AI implementation designed to save staff time and improve customer response speed.</p>
                  <ul className="text-xs text-zinc-500 space-y-2">
                    <li className="flex items-center gap-2"><Icon icon="solar:check-circle-linear" className="text-azure-500" /> Internal knowledge assistants</li>
                    <li className="flex items-center gap-2"><Icon icon="solar:check-circle-linear" className="text-azure-500" /> Automated intake systems</li>
                  </ul>
                </div>
              </div>

              <div className="group relative p-6 rounded-2xl border border-white/[0.05] bg-zinc-950 hover:border-zinc-700 transition-all overflow-hidden flex flex-col h-full md:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <Icon icon="solar:chart-square-linear" width={24} height={24} className="text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium tracking-tight text-zinc-100 mb-2">Analytics &amp; Visibility</h3>
                  <p className="text-sm text-azure-500 mb-6 flex-grow">Systems for operational reporting, business dashboards, and workflow monitoring.</p>
                </div>
              </div>

              <div className="group relative p-6 rounded-2xl border border-white/[0.05] bg-zinc-950 hover:border-zinc-700 transition-all overflow-hidden flex flex-col h-full md:col-span-2 lg:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <Icon icon="solar:widget-linear" width={24} height={24} className="text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium tracking-tight text-zinc-100 mb-2">Custom Systems</h3>
                  <p className="text-sm text-azure-500 mb-4 max-w-xl">When off-the-shelf software isn't enough, we build custom portals, internal dashboards, and lightweight SaaS-style automation infrastructure specifically for your operations.</p>
                  <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-500">
                    <span>API Integrations</span>
                    <span>Data Processing</span>
                    <span className="hidden sm:inline">Orchestration</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section id="clients" className="py-24 px-6 border-y border-white/[0.02] bg-zinc-950/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-100 mb-6">Built for Service Businesses</h2>
            <p className="text-base text-azure-500 mb-10 max-w-2xl mx-auto">
              We partner with businesses that rely heavily on manual processes, use fragmented software, and want practical improvements without hiring internal technical staff.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">Wellness &amp; Med Spas</span>
              <span className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">Hospitality &amp; Boutique Hotels</span>
              <span className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">Real Estate Teams</span>
              <span className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">Fitness Studios</span>
              <span className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">Clinics &amp; Professional Services</span>
              <span className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">Contractors</span>
            </div>
          </div>
        </section>

        {/* CTA / Contact Section */}
        <section id="contact" className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-zinc-100 mb-6">Ready to operate more intelligently?</h2>
            <p className="text-base text-azure-500 mb-10">
              Stop letting manual work dictate your growth. Let's discuss how practical AI and automation can streamline your day-to-day operations.
            </p>
            <form className="max-w-md mx-auto flex flex-col gap-4 text-left border border-white/[0.05] p-6 rounded-2xl bg-zinc-950 shadow-2xl">
              <div className="space-y-1">
                <label htmlFor="moxilabs-email" className="text-xs font-medium text-zinc-300">Work Email</label>
                <input
                  type="email"
                  id="moxilabs-email"
                  placeholder="you@company.com"
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="moxilabs-interest" className="text-xs font-medium text-zinc-300">Primary Interest</label>
                <div className="relative">
                  <select
                    id="moxilabs-interest"
                    className="flex h-9 w-full appearance-none rounded-md border border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 text-zinc-300"
                  >
                    <option value="" className="bg-zinc-950">Select an area...</option>
                    <option value="audit" className="bg-zinc-950">Workflow Audit</option>
                    <option value="automation" className="bg-zinc-950">Business Automation</option>
                    <option value="ai" className="bg-zinc-950">AI Integration</option>
                    <option value="custom" className="bg-zinc-950">Custom Systems</option>
                  </select>
                  <Icon icon="solar:alt-arrow-down-linear" className="absolute right-3 top-2.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200/90 h-9 px-4 py-2"
              >
                Request Consultation
              </button>
              <p className="text-xs text-zinc-600 text-center mt-2">Local, long-term partnerships. No pressure.</p>
            </form>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-zinc-950 py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-azure-500 font-medium tracking-tighter text-sm uppercase">Moxi Labs AI</span>
          <div className="text-xs text-zinc-500">
            © 2024 Moxi Labs AI. Systems-focused operational partners.
          </div>
          <div className="flex gap-4 text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">
              <Icon icon="solar:letter-linear" width={20} height={20} />
            </a>
            <a href="#" className="hover:text-zinc-300 transition-colors">
              <Icon icon="solar:map-point-linear" width={20} height={20} />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default MoxiLabs;
