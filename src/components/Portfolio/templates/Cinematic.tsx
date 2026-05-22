import React, { useCallback, useEffect, useRef, useState } from 'react';
import { format, parseISO, addWeeks, isBefore, startOfDay } from 'date-fns';
import { useEvents } from '../../Events/useEvents';
import type { PortfolioItem } from '../types';

const DEFAULT_ACCENT = '#74e5ff';
const GALLERY_INTERVAL_MS = 4000;
const AUTO_ADVANCE_MS = 6000;

type CinematicProps = {
  items: PortfolioItem[];
  autoplay?: boolean;
  showNav?: boolean;
};

function ProjectSlide({ item, isActive }: { item: PortfolioItem; isActive: boolean }) {
  const accent = item.css_options?.accent ?? DEFAULT_ACCENT;
  const images = [item.image, ...(item.gallery ?? [])].filter(Boolean) as string[];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (!isActive || images.length <= 1) return;
    const id = setInterval(() => setBgIndex((i) => (i + 1) % images.length), GALLERY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActive, images.length]);

  const bg = images[bgIndex];

  return (
    <div className="absolute inset-0">
      {bg && (
        <img
          key={bg}
          src={bg}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 max-w-4xl">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm bg-white/10"
                style={{ color: accent }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">{item.title}</h2>
        {item.subtitle && (
          <p className="text-xl mt-2" style={{ color: accent }}>
            {item.subtitle}
          </p>
        )}
        {item.text && <p className="text-base text-white/70 mt-4 max-w-2xl">{item.text}</p>}
        {item.link && item.link !== '#' && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full text-sm font-semibold backdrop-blur-sm transition-all hover:opacity-80"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}60` }}
          >
            View Project →
          </a>
        )}
      </div>
    </div>
  );
}

function EventInfo({ siteSlug, eventId, accent }: { siteSlug: string; eventId?: string; accent: string }) {
  const { events } = useEvents(siteSlug);
  const event = eventId
    ? (events.find((e) => e.id === eventId) ?? events[0] ?? null)
    : (events[0] ?? null);

  if (!event) return null;

  const base = parseISO(event.start_at);
  const today = startOfDay(new Date());
  let nextDate = base;
  if (event.rrule?.includes('FREQ=WEEKLY')) {
    while (isBefore(nextDate, today)) nextDate = addWeeks(nextDate, 1);
  }
  const dateLabel = format(nextDate, 'EEEE, MMMM d');
  const timeLabel = format(base, 'h:mm a');
  const spotsLeft = event.max_capacity != null ? event.max_capacity - event.registered_count : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const capacityPct = event.max_capacity != null
    ? Math.min(100, (event.registered_count / event.max_capacity) * 100)
    : 0;

  return (
    <div className="mt-8 flex flex-col items-center gap-3 text-sm">
      <div className="flex items-center gap-2 text-white/60">
        <span>📅</span>
        <span>{dateLabel} · {timeLabel} PT</span>
      </div>
      {event.location && (
        <div className="flex items-center gap-2 text-white/60">
          <span>📍</span>
          {event.location_url ? (
            <a
              href={event.location_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: accent }}
              onClick={(e) => e.stopPropagation()}
            >
              {event.location}
            </a>
          ) : (
            <span>{event.location}</span>
          )}
        </div>
      )}
      {event.max_capacity != null && (
        <div className="flex flex-col items-center gap-1.5 w-52">
          <div className="flex justify-between w-full text-xs text-white/40">
            <span>👥 {event.registered_count} attending</span>
            <span>{isFull ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}</span>
          </div>
          <div className="h-px w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${capacityPct}%`, backgroundColor: isFull ? '#ef4444' : accent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SplashSlide({ item }: { item: PortfolioItem }) {
  const accent = item.css_options?.accent ?? DEFAULT_ACCENT;
  const bg = item.css_options?.bg_color;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      style={bg ? { background: bg } : { background: '#000' }}
    >
      {/* radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${accent}22 0%, transparent 65%)` }}
      />
      <div className="relative flex flex-col items-center gap-6">
        {item.logo ? (
          <img
            src={item.logo}
            alt={item.title}
            className="h-24 md:h-36 w-auto object-contain"
            style={{ filter: `drop-shadow(0 0 32px ${accent}88)` }}
          />
        ) : (
          <h1
            className="text-6xl md:text-8xl font-black tracking-widest uppercase"
            style={{ color: accent, textShadow: `0 0 60px ${accent}66` }}
          >
            {item.title}
          </h1>
        )}
        {item.subtitle && (
          <p className="text-base md:text-xl tracking-[0.3em] uppercase text-white/50">
            {item.subtitle}
          </p>
        )}
        {item.display_url && (
          <p
            className="text-sm md:text-base font-mono tracking-widest"
            style={{
              color: accent,
              opacity: 0.6,
              animation: 'urlBrighten 4s ease-out 1.5s forwards',
            }}
          >
            {item.display_url}
            <style>{`
              @keyframes urlBrighten {
                from { opacity: 0.6; text-shadow: none; }
                to   { opacity: 1; text-shadow: 0 0 24px ${accent}cc, 0 0 8px ${accent}88; }
              }
            `}</style>
          </p>
        )}
      </div>
    </div>
  );
}

function CtaSlide({ item }: { item: PortfolioItem }) {
  const accent = item.css_options?.accent ?? DEFAULT_ACCENT;
  const bg = item.css_options?.bg_color;

  // Pull live event data when site_slug is set
  const { events } = useEvents(item.site_slug ?? '');
  const liveEvent = item.site_slug
    ? (item.event_id ? events.find((e) => e.id === item.event_id) : events[0]) ?? null
    : null;

  const title = liveEvent?.title ?? item.title;
  const subtitle = liveEvent ? null : item.subtitle; // subtitle comes from JSON only
  const text = liveEvent?.description ?? item.text;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      style={bg ? { background: bg } : { background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 70%)` }}
      />
      <div className="relative max-w-3xl">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-3 py-1 rounded-full bg-white/10"
                style={{ color: accent }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-xl md:text-2xl mt-4" style={{ color: accent }}>
            {subtitle}
          </p>
        )}
        {text && (
          <p className="text-base md:text-lg text-white/70 mt-6 leading-relaxed">{text}</p>
        )}
        {item.site_slug && (
          <EventInfo siteSlug={item.site_slug} eventId={item.event_id} accent={accent} />
        )}
        {(item.display_url || item.cta_url) && (
          <p
            className="mt-10 text-lg md:text-xl font-mono tracking-widest uppercase"
            style={{ color: accent }}
          >
            {item.display_url ?? item.cta_url!.replace(/^https?:\/\//, '')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Cinematic({ items, autoplay = false, showNav = true }: CinematicProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev' = 'next') => {
      if (transitioning || index === activeIndex) return;
      setPrev(activeIndex);
      setDirection(dir);
      setTransitioning(true);
      setActiveIndex(index);
      setTimeout(() => {
        setPrev(null);
        setTransitioning(false);
      }, 600);
    },
    [activeIndex, transitioning]
  );

  const next = useCallback(() => goTo((activeIndex + 1) % items.length, 'next'), [activeIndex, goTo, items.length]);
  const back = useCallback(() => goTo((activeIndex - 1 + items.length) % items.length, 'prev'), [activeIndex, goTo, items.length]);

  useEffect(() => {
    if (!autoplay || paused) return;
    autoRef.current = setInterval(next, AUTO_ADVANCE_MS);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoplay, paused, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back]);

  const slideStyle = (index: number): React.CSSProperties => {
    const isActive = index === activeIndex;
    const isPrev = index === prev;
    if (!isActive && !isPrev) return { opacity: 0, pointerEvents: 'none', position: 'absolute', inset: 0 };
    return {
      position: 'absolute',
      inset: 0,
      opacity: isActive ? 1 : 0,
      transform: isActive
        ? 'translateX(0) scale(1)'
        : `translateX(${direction === 'next' ? '-4%' : '4%'}) scale(0.98)`,
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 2 : 1,
    };
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height: '85vh' }}
      onClick={() => autoplay && setPaused(p => !p)}
    >
      {items.map((item, i) => (
        <div key={item.id} style={slideStyle(i)}>
          {item.type === 'splash'
            ? <SplashSlide item={item} />
            : item.type === 'cta'
            ? <CtaSlide item={item} />
            : <ProjectSlide item={item} isActive={i === activeIndex} />
          }
        </div>
      ))}

      {showNav && <button
        onClick={back}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all"
        aria-label="Previous"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>}
      {showNav && <button
        onClick={next}
        className="absolute right-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all"
        aria-label="Next"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>}

      {showNav && <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > activeIndex ? 'next' : 'prev')}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: i === activeIndex ? DEFAULT_ACCENT : 'rgba(255,255,255,0.3)',
              transform: i === activeIndex ? 'scale(1.4)' : 'scale(1)',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>}

      {autoplay && !paused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
          <div
            key={activeIndex}
            style={{
              height: '100%',
              background: DEFAULT_ACCENT,
              animation: `cinematic-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes cinematic-progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
