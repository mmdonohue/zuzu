import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO, addWeeks, isBefore } from "date-fns";
import { useEvents } from "../../../components/Events/useEvents";
import { fetchWithCsrf } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import MOXILABS_CONFIG from "../config";
import type { EventTopic } from "../../../components/Events/types";

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

const ACCENT = "#74e5ff";

function getNextOccurrence(startAt: string, rrule?: string): Date {
  const base = parseISO(startAt);
  if (!rrule) return base;
  const today = new Date();
  let next = base;
  while (isBefore(next, today)) {
    next = addWeeks(next, 1);
  }
  return next;
}

function formatRecurring(rrule: string): string {
  if (rrule.includes("BYDAY=TH")) return "Every Thursday";
  if (rrule.includes("BYDAY=MO")) return "Every Monday";
  if (rrule.includes("BYDAY=TU")) return "Every Tuesday";
  if (rrule.includes("BYDAY=WE")) return "Every Wednesday";
  if (rrule.includes("BYDAY=FR")) return "Every Friday";
  if (rrule.includes("FREQ=WEEKLY")) return "Weekly";
  return "Recurring";
}

type SubmitStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "full"
  | "duplicate";

const MoxiLabsEventDetail: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loading, error } = useEvents(MOXILABS_CONFIG.slug);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [reference, setReference] = useState("");
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);
  const [topics, setTopics] = useState<EventTopic[]>([]);
  const [votedTopics, setVotedTopics] = useState<Set<string>>(new Set());
  const [votingTopicId, setVotingTopicId] = useState<string | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const exportTopics = () => {
    const payload = {
      event: events[0]
        ? {
            title: events[0].title,
            description: events[0].description,
            location: events[0].location,
          }
        : null,
      topics: topics.map(
        ({ id, title, description, text, up_votes, display_order }) => ({
          id,
          title,
          description,
          text,
          up_votes,
          display_order,
        }),
      ),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topics-${eventId?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bgImage = useMemo(
    () => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)],
    [],
  );
  const maskStyle =
    "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)";

  // Fetch topics when event is known
  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events/${MOXILABS_CONFIG.slug}/${eventId}/topics`)
      .then((r) => r.json())
      .then((d: { topics: EventTopic[] }) => setTopics(d.topics ?? []))
      .catch(() => {});
  }, [eventId]);

  const handleVote = async (topicId: string) => {
    if (votedTopics.has(topicId) || votingTopicId) return;
    setVotingTopicId(topicId);
    try {
      const res = await fetchWithCsrf(
        `/api/events/${MOXILABS_CONFIG.slug}/${eventId}/topics/${topicId}/vote`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = (await res.json()) as {
        up_votes?: number;
        message?: string;
      };
      if (res.ok && data.up_votes != null) {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicId ? { ...t, up_votes: data.up_votes! } : t,
          ),
        );
        setVotedTopics((prev) => new Set(prev).add(topicId));
      }
    } catch {
      // silent
    } finally {
      setVotingTopicId(null);
    }
  };

  useEffect(() => {
    const tailwind = document.createElement("script");
    tailwind.src = "https://cdn.tailwindcss.com";
    tailwind.id = "moxilabs-tailwind-cdn";
    if (!document.getElementById("moxilabs-tailwind-cdn"))
      document.head.appendChild(tailwind);

    const fonts = document.createElement("link");
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
    fonts.rel = "stylesheet";
    fonts.id = "moxilabs-fonts";
    if (!document.getElementById("moxilabs-fonts"))
      document.head.appendChild(fonts);

    return () => {
      document.getElementById("moxilabs-tailwind-cdn")?.remove();
      document.getElementById("moxilabs-fonts")?.remove();
    };
  }, []);

  const event = events.find((e) => e.id === eventId);
  const accent = (event?.metadata as Record<string, string>)?.accent ?? ACCENT;
  const displayCount = registeredCount ?? event?.registered_count ?? 0;

  const nextDate = event
    ? getNextOccurrence(event.start_at, event.rrule)
    : null;
  const spotsLeft =
    event?.max_capacity != null ? event.max_capacity - displayCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const handleRegister = async () => {
    if (!email || submitStatus === "loading" || !event) return;
    setSubmitStatus("loading");
    try {
      const res = await fetchWithCsrf(
        `/api/events/${MOXILABS_CONFIG.slug}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: event.id, email, name, notes }),
          credentials: "include",
        },
      );

      const data = (await res.json()) as {
        message?: string;
        reference?: string;
        registered_count?: number;
      };

      if (res.status === 409) {
        const msg = data.message ?? "";
        setSubmitStatus(
          msg.toLowerCase().includes("capacity") ? "full" : "duplicate",
        );
        return;
      }
      if (!res.ok) throw new Error("Registration failed");

      setReference(data.reference ?? "");
      if (data.registered_count != null)
        setRegisteredCount(data.registered_count);
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    }
  };

  return (
    <div
      className="antialiased scroll-smooth relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", color: "#bcf1fe" }}
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
            <button
              onClick={() => navigate(`${MOXILABS_CONFIG.route}/events`)}
              className="hover:text-zinc-100 transition-colors"
            >
              ← All Events
            </button>
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
        {loading && (
          <div className="text-center py-40 text-zinc-500 text-sm">
            Loading...
          </div>
        )}
        {error && (
          <div className="text-center py-40 text-zinc-500 text-sm">{error}</div>
        )}
        {!loading && !event && !error && (
          <div className="text-center py-40 text-zinc-500 text-sm">
            Event not found.
          </div>
        )}

        {event && nextDate && (
          <div className="max-w-3xl mx-auto px-6 py-16">
            {/* Event hero image */}
            {event.image && (
              <div className="w-full h-56 rounded-xl overflow-hidden mb-10">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Badge */}
            {event.template === "recurring" && event.rrule && (
              <div
                className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/50 px-3 py-1 text-xs font-medium mb-5 w-fit"
                style={{ color: accent }}
              >
                <span
                  className="mr-1.5 h-1.5 w-1.5 rounded-full inline-block"
                  style={{ backgroundColor: accent }}
                />
                {formatRecurring(event.rrule)}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-zinc-100 mb-6">
              {event.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-col gap-3 mb-8 text-sm text-zinc-400">
              <div className="flex items-start gap-3">
                <Icon
                  icon="mdi:calendar-outline"
                  width={16}
                  height={16}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <div className="text-zinc-100">
                    {format(nextDate, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div>
                    {format(parseISO(event.start_at), "h:mm a")}
                    {event.end_at &&
                      ` – ${format(parseISO(event.end_at), "h:mm a")}`}
                    {" PT"}
                    {event.template === "recurring" &&
                      event.rrule &&
                      ` · ${formatRecurring(event.rrule)}`}
                  </div>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <Icon
                    icon="mdi:map-marker-outline"
                    width={16}
                    height={16}
                    className="mt-0.5 shrink-0"
                  />
                  {event.location_url ? (
                    <a
                      href={event.location_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-100 hover:text-zinc-200 transition-colors"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <span className="text-zinc-100">{event.location}</span>
                  )}
                </div>
              )}
              {event.max_capacity != null && (
                <div className="flex items-center gap-3">
                  <Icon
                    icon="mdi:account-group-outline"
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                  <div>
                    <span className="text-zinc-100">{displayCount}</span>{" "}
                    attending
                    {spotsLeft !== null && !isFull && (
                      <span
                        className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10"
                        style={{ color: accent }}
                      >
                        {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} remaining
                      </span>
                    )}
                    {isFull && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-900/30 border border-red-800/40 text-red-400">
                        Full
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <p
                className="text-zinc-200 bg-zinc-200/20 leading-relaxed text-base mb-10 border-l-2 pl-4"
                style={{ borderColor: accent }}
              >
                {event.description}
              </p>
            )}

            {/* Topics */}
            {topics.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
                    Topics — Vote for what matters to you
                  </h2>
                  {isAdmin && (
                    <button
                      onClick={exportTopics}
                      className="text-xs px-3 py-1 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-100 hover:border-white/20 transition-all"
                    >
                      Export JSON
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {topics.map((topic) => {
                    const voted = votedTopics.has(topic.id);
                    const voting = votingTopicId === topic.id;
                    const maxVotes = Math.max(
                      ...topics.map((t) => t.up_votes),
                      1,
                    );
                    return (
                      <div
                        key={topic.id}
                        className="rounded-xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm p-4 flex gap-4 items-start"
                      >
                        {topic.image && (
                          <img
                            src={topic.image}
                            alt={topic.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-zinc-100">
                                {topic.title}
                              </p>
                              {topic.description && (
                                <p className="text-xs text-zinc-300 mt-0.5">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleVote(topic.id)}
                              disabled={voted || !!votingTopicId}
                              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium"
                              style={{
                                borderColor: voted
                                  ? accent
                                  : "rgba(255,255,255,0.08)",
                                color: voted ? accent : "rgba(255,255,255,0.4)",
                                background: voted
                                  ? `${accent}15`
                                  : "transparent",
                                cursor: voted
                                  ? "default"
                                  : voting
                                    ? "wait"
                                    : "pointer",
                              }}
                            >
                              <span>{voted ? "▲" : "△"}</span>
                              <span>{topic.up_votes}</span>
                            </button>
                          </div>
                          {/* Vote bar */}
                          <div className="mt-2 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(topic.up_votes / maxVotes) * 100}%`,
                                backgroundColor: accent,
                                opacity: 0.5,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/[0.06] mb-10" />

            {/* Registration form */}
            {submitStatus === "success" ? (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-sm p-8 text-center">
                <div className="text-2xl mb-4">✓</div>
                <h2 className="text-xl font-medium text-zinc-100 mb-2">
                  You're in!
                </h2>
                <p className="text-sm text-zinc-200 mb-4">
                  A confirmation has been sent to{" "}
                  <span className="text-zinc-200">{email}</span>
                </p>
                {reference && (
                  <p className="text-xs text-zinc-400">
                    Reference:{" "}
                    <span className="font-mono" style={{ color: accent }}>
                      #{reference}
                    </span>
                  </p>
                )}
                {event.max_capacity != null && (
                  <p className="text-xs text-zinc-400 mt-2">
                    {displayCount} of {event.max_capacity} seats filled
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/30 backdrop-blur-sm p-8">
                <h2 className="text-lg font-medium text-zinc-100 mb-6">
                  {event.cta_label ?? "Reserve Your Seat"}
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Name <span className="text-zinc-600">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-md bg-zinc-800/60 border border-white/[0.08] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-md bg-zinc-800/60 border border-white/[0.08] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      What challenge are you trying to solve?{" "}
                      <span className="text-zinc-600">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Help us prepare a useful conversation..."
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-md bg-zinc-800/60 border border-white/[0.08] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none"
                    />
                  </div>

                  {submitStatus === "duplicate" && (
                    <p className="text-xs text-amber-400">
                      You're already registered for this event.
                    </p>
                  )}
                  {submitStatus === "full" && (
                    <p className="text-xs text-red-400">
                      Sorry, this event is now at capacity.
                    </p>
                  )}
                  {submitStatus === "error" && (
                    <p className="text-xs text-red-400">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <button
                    onClick={handleRegister}
                    disabled={!email || submitStatus === "loading" || isFull}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accent, color: "#09090b" }}
                  >
                    {submitStatus === "loading"
                      ? "Reserving..."
                      : (event.cta_label ?? "Reserve Your Seat")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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

export default MoxiLabsEventDetail;
