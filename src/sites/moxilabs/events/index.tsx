import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../../components/Events/useEvents';
import EventCard from '../../../components/Events/EventCard';
import MOXILABS_CONFIG from '../config';

const BG_IMAGES = [
  "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/variants/f27d997b-82cd-4784-b79b-449c5d13aa67/3840w.png",
  "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/variants/e9f9955e-7c64-4ca8-b81a-604505c4863b/3840w.png",
  "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/a18c4ab3-6e4c-43e5-a447-f73928b7dc48_3840w.webp",
];

const CUSTOM_STYLES = `
  a { color: inherit; }
  .text-azure-500 { color: #bcf1fe !important; }
  .text-azure-800 { color: #6ce6faad !important; }
  .bg-grid {
    background-size: 3rem 3rem;
    background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  }
  .mask-radial {
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  }
`;

const ACCENT = '#74e5ff';

const MoxiLabsEvents: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading, error } = useEvents(MOXILABS_CONFIG.slug);
  const bgImage = useMemo(() => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)], []);
  const maskStyle = 'linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)';

  useEffect(() => {
    const tailwind = document.createElement('script');
    tailwind.src = 'https://cdn.tailwindcss.com';
    tailwind.id = 'moxilabs-tailwind-cdn';
    if (!document.getElementById('moxilabs-tailwind-cdn')) document.head.appendChild(tailwind);

    const fonts = document.createElement('link');
    fonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
    fonts.rel = 'stylesheet';
    fonts.id = 'moxilabs-fonts';
    if (!document.getElementById('moxilabs-fonts')) document.head.appendChild(fonts);

    return () => {
      document.getElementById('moxilabs-tailwind-cdn')?.remove();
      document.getElementById('moxilabs-fonts')?.remove();
    };
  }, []);

  return (
    <div
      className="antialiased scroll-smooth relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", color: '#bcf1fe' }}
    >
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />

      {/* Background */}
      <div
        className="fixed top-0 w-full h-screen bg-cover bg-center -z-10"
        style={{
          backgroundImage: `url("${bgImage}")`,
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle,
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
        <div className="absolute inset-0 bg-grid mask-radial" />
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-zinc-950/50 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 w-full border-b border-white/[0.05] bg-zinc-950/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(MOXILABS_CONFIG.route)}
            className="text-zinc-100 font-medium tracking-tighter text-4xl uppercase hover:opacity-80 transition-opacity"
          >
            MOXI LABS AI
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-azure-800">
            <button onClick={() => navigate(MOXILABS_CONFIG.route)} className="hover:text-zinc-100 transition-colors">← Back</button>
            <span style={{ color: ACCENT }}>Events</span>
          </div>
          <a
            href={`${MOXILABS_CONFIG.route}#contact`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200/90 h-9 px-4 py-2"
          >
            Get an Audit
          </a>
        </div>
      </nav>

      <main className="relative z-10 flex-grow">
        {/* Header */}
        <section className="pt-20 pb-10 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-6">
              <span className="flex h-2 w-2 rounded-full mr-2" style={{ backgroundColor: ACCENT }} />
              Palm Springs &amp; Online
            </div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tighter text-azure-800 leading-tight mb-4">
              Upcoming Events
            </h1>
            <p className="text-base text-azure-500 max-w-xl leading-relaxed">
              Real conversations about AI, automation, and ops for small business owners. No pitch. No fluff.
            </p>
          </div>
        </section>

        {/* Events grid */}
        <section className="pb-24 px-6">
          <div className="max-w-4xl mx-auto">
            {loading && (
              <div className="text-center py-20 text-zinc-500 text-sm">Loading events...</div>
            )}
            {error && (
              <div className="text-center py-20 text-zinc-500 text-sm">{error}</div>
            )}
            {!loading && !error && events.length === 0 && (
              <div className="text-center py-20 text-zinc-500 text-sm">No upcoming events. Check back soon.</div>
            )}
            {!loading && events.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    accent={(event.metadata as Record<string, string>)?.accent ?? ACCENT}
                    onClick={() => navigate(`${MOXILABS_CONFIG.route}/events/${event.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] py-6 px-6">
        <div className="max-w-6xl mx-auto text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} Moxi Labs AI · Palm Springs, CA
        </div>
      </footer>
    </div>
  );
};

export default MoxiLabsEvents;
