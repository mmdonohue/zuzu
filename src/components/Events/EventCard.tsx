import React from 'react';
import { format, parseISO, addWeeks, isBefore, startOfDay } from 'date-fns';
import type { SiteEvent } from './types';

function getNextOccurrence(startAt: string, rrule?: string): Date {
  const base = parseISO(startAt);
  if (!rrule) return base;
  const today = startOfDay(new Date());
  let next = base;
  while (isBefore(next, today)) {
    next = addWeeks(next, 1);
  }
  return next;
}

function formatRecurring(rrule: string): string {
  if (rrule.includes('BYDAY=TH')) return 'Every Thursday';
  if (rrule.includes('BYDAY=MO')) return 'Every Monday';
  if (rrule.includes('BYDAY=TU')) return 'Every Tuesday';
  if (rrule.includes('BYDAY=WE')) return 'Every Wednesday';
  if (rrule.includes('BYDAY=FR')) return 'Every Friday';
  if (rrule.includes('FREQ=WEEKLY')) return 'Weekly';
  if (rrule.includes('FREQ=MONTHLY')) return 'Monthly';
  return 'Recurring';
}

type Props = {
  event: SiteEvent;
  onClick?: () => void;
  accent?: string;
};

const EventCard: React.FC<Props> = ({ event, onClick, accent = '#74e5ff' }) => {
  const nextDate = getNextOccurrence(event.start_at, event.rrule);
  const dateLabel = format(nextDate, 'EEEE, MMMM d');
  const timeLabel = format(parseISO(event.start_at), 'h:mm a');
  const endTimeLabel = event.end_at ? ` – ${format(parseISO(event.end_at), 'h:mm a')}` : '';
  const spotsLeft = event.max_capacity != null ? event.max_capacity - event.registered_count : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const capacityPct = event.max_capacity != null
    ? Math.min(100, (event.registered_count / event.max_capacity) * 100)
    : 0;

  return (
    <div
      onClick={!isFull ? onClick : undefined}
      className="group relative rounded-xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/80"
      style={{ cursor: isFull ? 'default' : 'pointer' }}
    >
      {/* Image */}
      {event.image && (
        <div className="h-40 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 bg-zinc-300/30">
        {/* Template badge */}
        {event.template === 'recurring' && event.rrule && (
          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 w-fit" style={{ color: accent }}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: accent }} />
            {formatRecurring(event.rrule)}
          </span>
        )}

        <h3 className="text-zinc-100 font-medium text-lg leading-tight">{event.title}</h3>

        {/* Date & time */}
        <div className="flex items-start gap-2 text-sm text-zinc-400">
          <span className="mt-0.5">📅</span>
          <div>
            <div>{dateLabel}</div>
            <div>{timeLabel}{endTimeLabel} PT</div>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="mt-0.5">📍</span>
            {event.location_url ? (
              <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200 transition-colors" onClick={(e) => e.stopPropagation()}>
                {event.location}
              </a>
            ) : (
              <span>{event.location}</span>
            )}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">{event.description}</p>
        )}

        {/* Capacity bar */}
        {event.max_capacity != null && (
          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>{event.registered_count} attending</span>
              <span>{isFull ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${capacityPct}%`, backgroundColor: isFull ? '#ef4444' : accent }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          disabled={isFull}
          className="mt-1 w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={isFull ? { border: '1px solid rgba(255,255,255,0.1)', color: '#71717a' } : { backgroundColor: accent, color: '#09090b' }}
        >
          {isFull ? 'Event Full' : (event.cta_label ?? 'RSVP')}
        </button>
      </div>
    </div>
  );
};

export default EventCard;
