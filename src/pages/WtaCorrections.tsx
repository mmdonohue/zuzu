import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchWithCsrf } from "@/services/api";
import { csrfService } from "@/services/csrf.service";

// ── Types ──────────────────────────────────────────────────────────────────────

type WtaPlayer = { name: string; outfit: string[] };

type WtaVideo = {
  video_id: string;
  players: string;
  location: string;
  alignment: string;
  court_hex: string[];
  skin_hex: string[];
  p1: WtaPlayer;
  p2: WtaVideo["p1"];
  corrected: boolean;
  thumb_url: string;
  frame_paths: string[];
};

type PlayerCorrection = {
  outfit_add: string[];
  outfit_remove: string[];
};

type VideoCorrection = {
  p1: PlayerCorrection;
  p2: PlayerCorrection;
  skin_add: string[];
  skin_remove: string[];
  notes?: string;
};

type Corrections = Record<string, VideoCorrection>;

type DragInfo = {
  hex: string;
  fromPlayer: "p1" | "p2";
  type: "detected" | "added";
};

type GlobalCourtCorr = {
  court_primary: string | null;
  court_secondary: string | null;
  skin_tones: string[];
};

// ── Constants ──────────────────────────────────────────────────────────────────

const CARD_BG = "#ffffff22";
const CARD_BORDER = "1px solid rgba(255,255,255,0.25)";
const CARD_CHANGED = "1px solid rgba(21,101,192,0.8)";
const TEXT_PRIMARY = "#fff";
const TEXT_DIM = "#ffffffcc";
const TEXT_FAINT = "#ffffffaa";
const ACCENT = "#1565C0";

// ── Helpers ────────────────────────────────────────────────────────────────────

const emptyPlayerCorr = (): PlayerCorrection => ({
  outfit_add: [],
  outfit_remove: [],
});
const emptyVideoCorr = (): VideoCorrection => ({
  p1: emptyPlayerCorr(),
  p2: emptyPlayerCorr(),
  skin_add: [],
  skin_remove: [],
});

function normalizeCorr(raw: unknown): VideoCorrection {
  const r = (raw ?? {}) as Record<string, unknown>;
  const p1 = (r.p1 ?? {}) as Record<string, unknown>;
  const p2 = (r.p2 ?? {}) as Record<string, unknown>;
  return {
    p1: {
      outfit_add: (p1.outfit_add as string[]) ?? [],
      outfit_remove: (p1.outfit_remove as string[]) ?? [],
    },
    p2: {
      outfit_add: (p2.outfit_add as string[]) ?? [],
      outfit_remove: (p2.outfit_remove as string[]) ?? [],
    },
    skin_add: (r.skin_add as string[]) ?? [],
    skin_remove: (r.skin_remove as string[]) ?? [],
    notes: r.notes as string | undefined,
  };
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function parseVenueName(location: string): string {
  return location
    .replace(/\b(Round\s+\d+|R\d+|QF|SF|Final|Quarterfinal|Semifinal)\b.*/i, "")
    .trim();
}

function normalizeHex(hex: string): string {
  const h = hex.trim().toUpperCase();
  return h.startsWith("#") ? h : `#${h}`;
}

const NEAR_BLACK_THRESHOLD = 60;
const NEAR_WHITE_THRESHOLD = 220;

const FLOWER_GOLDEN_ANGLE_DEG = 137.508;
const FLOWER_SVG_SIZE = 400;
const FLOWER_MARGIN_PX = 20;
const FLOWER_BASE_PETAL_H = 44;
const FLOWER_MIN_PETAL_H = 18;
const FLOWER_MAX_PETAL_H = 50;
const FLOWER_PETAL_ASPECT = 0.48;
const FLOWER_CENTER_DOT_R = 9;

function collapseNearBlack(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (
    r <= NEAR_BLACK_THRESHOLD &&
    g <= NEAR_BLACK_THRESHOLD &&
    b <= NEAR_BLACK_THRESHOLD
  )
    return "#000000";
  if (
    r >= NEAR_WHITE_THRESHOLD &&
    g >= NEAR_WHITE_THRESHOLD &&
    b >= NEAR_WHITE_THRESHOLD
  )
    return "#FFFFFF";
  return hex;
}

function frameFilename(p: string): string {
  return p.split("/").pop() ?? p;
}

function hexToHsvV(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return Math.max(r, g, b);
}

function samePlayerName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function propagatePlayerCorr(
  target: PlayerCorrection,
  oldSrc: PlayerCorrection,
  newSrc: PlayerCorrection,
): PlayerCorrection {
  let result = { ...target };
  // Newly added to outfit_add → add to target unless conflicting
  for (const hex of newSrc.outfit_add) {
    if (
      !oldSrc.outfit_add.includes(hex) &&
      !result.outfit_remove.includes(hex) &&
      !result.outfit_add.includes(hex)
    ) {
      result = { ...result, outfit_add: [...result.outfit_add, hex] };
    }
  }
  // Removed from outfit_add → remove from target
  for (const hex of oldSrc.outfit_add) {
    if (!newSrc.outfit_add.includes(hex)) {
      result = {
        ...result,
        outfit_add: result.outfit_add.filter((h) => h !== hex),
      };
    }
  }
  // Newly added to outfit_remove → add to target unless conflicting
  for (const hex of newSrc.outfit_remove) {
    if (
      !oldSrc.outfit_remove.includes(hex) &&
      !result.outfit_add.includes(hex) &&
      !result.outfit_remove.includes(hex)
    ) {
      result = { ...result, outfit_remove: [...result.outfit_remove, hex] };
    }
  }
  // Removed from outfit_remove → remove from target
  for (const hex of oldSrc.outfit_remove) {
    if (!newSrc.outfit_remove.includes(hex)) {
      result = {
        ...result,
        outfit_remove: result.outfit_remove.filter((h) => h !== hex),
      };
    }
  }
  return result;
}

function playerCorrChanged(a: PlayerCorrection, b: PlayerCorrection): boolean {
  return (
    a.outfit_add.join(",") !== b.outfit_add.join(",") ||
    a.outfit_remove.join(",") !== b.outfit_remove.join(",")
  );
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 140 ? "#000" : "#fff";
}

// ── Swatch ─────────────────────────────────────────────────────────────────────

type SwatchProps = {
  hex: string;
  label?: string;
  onRemove?: () => void;
  dim?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  borderColor?: string;
};

const Swatch: React.FC<SwatchProps> = ({
  hex,
  label,
  onRemove,
  dim,
  draggable,
  onDragStart,
  borderColor,
}) => (
  <div
    title={hex}
    draggable={draggable}
    onDragStart={onDragStart}
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: 6,
      background: hex,
      border: `1.5px solid ${borderColor ?? "rgba(255,255,255,0.25)"}`,
      opacity: dim ? 0.35 : 1,
      cursor: onRemove ? "pointer" : draggable ? "grab" : "default",
      flexShrink: 0,
    }}
    onClick={onRemove}
  >
    {label && (
      <span style={{ fontSize: 9, color: contrastColor(hex), fontWeight: 700 }}>
        {label}
      </span>
    )}
    {onRemove && (
      <span
        style={{
          position: "absolute",
          top: -5,
          right: -5,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#e53935",
          color: "#fff",
          fontSize: 10,
          lineHeight: "14px",
          textAlign: "center",
          fontWeight: 700,
        }}
      >
        ×
      </span>
    )}
  </div>
);

// ── FlowerPalette ──────────────────────────────────────────────────────────────

type FlowerPaletteProps = {
  colors: string[];
  centerColor?: string;
  size?: number;
};

const FlowerPalette: React.FC<FlowerPaletteProps> = ({
  colors,
  centerColor = "#e0e0e0",
  size = FLOWER_SVG_SIZE,
}) => {
  const center = size / 2;
  const sorted = [...colors].sort((a, b) => hexToHsvV(b) - hexToHsvV(a));
  const N = sorted.length;
  if (N === 0) return null;

  const petalH = Math.max(
    FLOWER_MIN_PETAL_H,
    Math.min(FLOWER_MAX_PETAL_H, FLOWER_BASE_PETAL_H - N * 0.6),
  );
  const petalW = petalH * FLOWER_PETAL_ASPECT;
  const spiralScale = (center - FLOWER_MARGIN_PX - petalH / 2) / Math.sqrt(N);
  const goldenRad = (FLOWER_GOLDEN_ANGLE_DEG * Math.PI) / 180;

  const petals = sorted.map((hex, n) => ({
    hex,
    r: spiralScale * Math.sqrt(n + 1),
    thetaDeg: (n * FLOWER_GOLDEN_ANGLE_DEG) % 360,
    thetaRad: n * goldenRad,
  }));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", margin: "0 auto" }}
    >
      {petals.map(({ hex, r, thetaDeg }, n) => (
        <ellipse
          key={n}
          rx={petalH / 2}
          ry={petalW / 2}
          fill={hex}
          stroke={`${contrastColor(hex)}30`}
          strokeWidth={1}
          transform={`translate(${center},${center}) rotate(${thetaDeg}) translate(${r},0)`}
        >
          <title>{hex}</title>
        </ellipse>
      ))}
      <circle
        cx={center}
        cy={center}
        r={FLOWER_CENTER_DOT_R}
        fill={centerColor}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={1}
      />
    </svg>
  );
};

// ── AddColorInput ──────────────────────────────────────────────────────────────

const AddColorInput: React.FC<{
  onAdd: (hex: string) => void;
  placeholder?: string;
}> = ({ onAdd, placeholder = "Add #hex" }) => {
  const [val, setVal] = useState("");
  const valid = isValidHex(normalizeHex(val));

  const submit = () => {
    if (!valid) return;
    onAdd(normalizeHex(val));
    setVal("");
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {val && valid && (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 3,
            background: normalizeHex(val),
            border: "1px solid rgba(255,255,255,0.3)",
            flexShrink: 0,
          }}
        />
      )}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        style={{
          minWidth: 100,
          padding: "3px 7px",
          borderRadius: 4,
          border: `1px solid ${val && !valid ? "#e53935" : "rgba(255,255,255,0.4)"}`,
          background: "#fff",
          color: "#000",
          fontSize: 12,
          fontWeight: 700,
          outline: "none",
        }}
      />
      <button
        onClick={submit}
        disabled={!valid}
        style={{
          padding: "4px 12px",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.4)",
          background: valid ? "#fff" : "rgba(255,255,255,0.15)",
          color: valid ? "#000" : TEXT_DIM,
          fontSize: 12,
          fontWeight: 700,
          minWidth: 36,
          cursor: valid ? "pointer" : "default",
        }}
      >
        +
      </button>
    </div>
  );
};

// ── PlayerSection ──────────────────────────────────────────────────────────────

type PlayerSectionProps = {
  player: WtaPlayer;
  corr: PlayerCorrection;
  playerId: "p1" | "p2";
  onChange: (c: PlayerCorrection) => void;
  onDragStart: (info: DragInfo) => void;
  onDrop: (toPlayer: "p1" | "p2") => void;
  isDragActive: boolean;
  globalSkinFilter: string[];
};

const PlayerSection: React.FC<PlayerSectionProps> = ({
  player,
  corr: corrRaw,
  playerId,
  onChange,
  onDragStart,
  onDrop,
  isDragActive,
  globalSkinFilter,
}) => {
  const corr: PlayerCorrection = {
    outfit_add: corrRaw?.outfit_add ?? [],
    outfit_remove: corrRaw?.outfit_remove ?? [],
  };
  const [dragOver, setDragOver] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);
  const skinSet = new Set(globalSkinFilter.map((h) => h.toUpperCase()));
  const detected = (player?.outfit ?? []).filter(
    (h) => !skinSet.has(h.toUpperCase()),
  );
  const removed = new Set(corr.outfit_remove);
  const added = corr.outfit_add.filter((h) => !skinSet.has(h.toUpperCase()));

  const removeDetected = (hex: string) =>
    onChange({
      outfit_add: corr.outfit_add,
      outfit_remove: [...corr.outfit_remove, hex],
    });
  const restoreDetected = (hex: string) =>
    onChange({
      outfit_add: corr.outfit_add,
      outfit_remove: corr.outfit_remove.filter((h) => h !== hex),
    });
  const addOutfit = (hex: string) => {
    if (added.includes(hex)) return;
    onChange({
      outfit_add: [...corr.outfit_add, hex],
      outfit_remove: corr.outfit_remove,
    });
  };
  const removeAdded = (hex: string) =>
    onChange({
      outfit_add: corr.outfit_add.filter((h) => h !== hex),
      outfit_remove: corr.outfit_remove,
    });

  return (
    <div
      style={{ flex: 1, minWidth: 0 }}
      onDragOver={(e) => {
        if (isDragActive) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onDrop(playerId);
      }}
    >
      <div
        style={{
          borderRadius: 8,
          padding: "8px 10px",
          border: dragOver
            ? `1px dashed ${ACCENT}`
            : `1px solid ${dragOver ? ACCENT : "rgba(255,255,255,0.1)"}`,
          background: dragOver ? "rgba(21,101,192,0.15)" : "transparent",
          transition: "all 0.15s",
          minHeight: 80,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#90CAF9",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {player?.name}
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}
        >
          {detected
            .filter((hex) => !removed.has(hex))
            .map((hex) => (
              <Swatch
                key={hex}
                hex={hex}
                onRemove={() => removeDetected(hex)}
                draggable
                onDragStart={() =>
                  onDragStart({ hex, fromPlayer: playerId, type: "detected" })
                }
              />
            ))}
          {added.map((hex) => (
            <Swatch
              key={`add-${hex}`}
              hex={hex}
              label="+"
              onRemove={() => removeAdded(hex)}
              draggable
              onDragStart={() =>
                onDragStart({ hex, fromPlayer: playerId, type: "added" })
              }
            />
          ))}
          {removed.size > 0 && (
            <button
              onClick={() => setShowRemoved((v) => !v)}
              style={{
                fontSize: 10,
                background: "none",
                border: "none",
                color: TEXT_FAINT,
                cursor: "pointer",
                padding: "2px 4px",
                alignSelf: "center",
              }}
            >
              {showRemoved ? "▾" : "▸"} {removed.size} removed
            </button>
          )}
        </div>
        {showRemoved && removed.size > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 8,
              paddingLeft: 4,
              borderLeft: "2px solid rgba(255,255,255,0.1)",
            }}
          >
            {[...removed].map((hex) => (
              <div
                key={hex}
                title="Click to restore"
                onClick={() => restoreDetected(hex)}
                style={{ cursor: "pointer" }}
              >
                <Swatch hex={hex} dim />
              </div>
            ))}
          </div>
        )}
        <AddColorInput onAdd={addOutfit} placeholder="Add outfit #hex" />
      </div>
    </div>
  );
};

// ── VideoCard ──────────────────────────────────────────────────────────────────

type VideoCardProps = {
  video: WtaVideo;
  corr: VideoCorrection;
  onChange: (c: VideoCorrection) => void;
  globalSkinFilter: string[];
};

// ── GlobalCourtSection ─────────────────────────────────────────────────────────

const SAMPLE_COUNT = 10;
const QUANTIZE_STEP = 24; // bucket size per channel for clustering

async function sampleCourtColorsFromFrames(
  videos: WtaVideo[],
): Promise<string[]> {
  const counts: Record<string, number> = {};

  const loadFrame = (url: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const SIZE = 100;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve();
          return;
        }
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
        for (let i = 0; i < data.length; i += 16) {
          const r = Math.round(data[i] / QUANTIZE_STEP) * QUANTIZE_STEP;
          const g = Math.round(data[i + 1] / QUANTIZE_STEP) * QUANTIZE_STEP;
          const b = Math.round(data[i + 2] / QUANTIZE_STEP) * QUANTIZE_STEP;
          // Skip near-black, near-white, and very low saturation
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (max < 40 || (max > 220 && sat < 0.1) || sat < 0.12) continue;
          const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          counts[hex] = (counts[hex] ?? 0) + 1;
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });

  const frames: string[] = [];
  for (const v of videos) {
    for (const fp of v.frame_paths.slice(0, 3)) {
      const filename = fp.split("/").pop() ?? fp;
      frames.push(`/api/wta/frames/${v.video_id}/${filename}`);
    }
  }
  await Promise.all(frames.map(loadFrame));

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, SAMPLE_COUNT)
    .map(([hex]) => hex);
}

const CourtSlot: React.FC<{
  label: string;
  hex: string | null;
  onSet: (hex: string) => void;
  onClear: () => void;
}> = ({ label, hex, onSet, onClear }) => (
  <div style={{ flex: 1, minWidth: 180 }}>
    <div
      style={{
        fontSize: 10,
        color: TEXT_FAINT,
        fontWeight: 700,
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {hex ? (
        <Swatch hex={hex} onRemove={onClear} />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: "1.5px dashed rgba(255,255,255,0.25)",
            flexShrink: 0,
          }}
        />
      )}
      <AddColorInput
        onAdd={onSet}
        placeholder={`Set ${label.toLowerCase()} #hex`}
      />
    </div>
  </div>
);

const GlobalCourtSection: React.FC<{
  detectedHex: string[];
  corr: GlobalCourtCorr;
  onChange: (c: GlobalCourtCorr) => void;
  videos: WtaVideo[];
}> = ({ detectedHex, corr, onChange, videos }) => {
  const [sampled, setSampled] = useState<string[]>([]);
  const [sampling, setSampling] = useState(false);

  const handleSample = async () => {
    setSampling(true);
    const colors = await sampleCourtColorsFromFrames(videos);
    setSampled(colors);
    setSampling(false);
  };

  const hasChanges =
    corr.court_primary !== null || corr.court_secondary !== null;

  return (
    <div
      style={{
        background: CARD_BG,
        border: hasChanges ? CARD_CHANGED : CARD_BORDER,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 20,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: TEXT_PRIMARY,
          marginBottom: 12,
        }}
      >
        Court Colors
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: TEXT_DIM,
            marginLeft: 8,
          }}
        >
          — global, applied across all videos
        </span>
      </div>

      {/* Primary / Secondary slots */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <CourtSlot
          label="Primary"
          hex={corr.court_primary}
          onSet={(h) => onChange({ ...corr, court_primary: h })}
          onClear={() => onChange({ ...corr, court_primary: null })}
        />
        <button
          onClick={() =>
            onChange({
              ...corr,
              court_primary: corr.court_secondary,
              court_secondary: corr.court_primary,
            })
          }
          title="Swap primary and secondary"
          style={{
            padding: "7px 10px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.4)",
            background: "#fff",
            color: "#000",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            flexShrink: 0,
            marginBottom: 2,
          }}
        >
          ⇄
        </button>
        <CourtSlot
          label="Secondary"
          hex={corr.court_secondary}
          onSet={(h) => onChange({ ...corr, court_secondary: h })}
          onClear={() => onChange({ ...corr, court_secondary: null })}
        />
      </div>

      {/* Detected court colors from notebook */}
      {detectedHex.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: TEXT_FAINT, marginBottom: 6 }}>
            detected by notebook — click P / S to assign
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {detectedHex.map((h) => (
              <div
                key={h}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Swatch
                  hex={h}
                  dim={corr.court_primary === h || corr.court_secondary === h}
                  label={
                    corr.court_primary === h
                      ? "P"
                      : corr.court_secondary === h
                        ? "S"
                        : undefined
                  }
                />
                <div style={{ display: "flex", gap: 2 }}>
                  <button
                    onClick={() => onChange({ ...corr, court_primary: h })}
                    style={{
                      padding: "1px 5px",
                      fontSize: 9,
                      fontWeight: 700,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.4)",
                      background:
                        corr.court_primary === h
                          ? "#fff"
                          : "rgba(255,255,255,0.15)",
                      color: corr.court_primary === h ? "#000" : TEXT_PRIMARY,
                      cursor: "pointer",
                    }}
                  >
                    P
                  </button>
                  <button
                    onClick={() => onChange({ ...corr, court_secondary: h })}
                    style={{
                      padding: "1px 5px",
                      fontSize: 9,
                      fontWeight: 700,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.4)",
                      background:
                        corr.court_secondary === h
                          ? "#fff"
                          : "rgba(255,255,255,0.15)",
                      color: corr.court_secondary === h ? "#000" : TEXT_PRIMARY,
                      cursor: "pointer",
                    }}
                  >
                    S
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frame color sampler */}
      {videos.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: sampled.length > 0 ? 8 : 0,
            }}
          >
            <button
              onClick={handleSample}
              disabled={sampling}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.4)",
                background: "#fff",
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                minWidth: 120,
                cursor: sampling ? "default" : "pointer",
              }}
            >
              {sampling ? "Sampling…" : "Sample from frames"}
            </button>
            {sampled.length > 0 && (
              <span style={{ fontSize: 10, color: TEXT_FAINT }}>
                set as primary or secondary
              </span>
            )}
          </div>
          {sampled.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {sampled.map((h) => (
                <div
                  key={h}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Swatch
                    hex={h}
                    dim={corr.court_primary === h || corr.court_secondary === h}
                    label={
                      corr.court_primary === h
                        ? "P"
                        : corr.court_secondary === h
                          ? "S"
                          : undefined
                    }
                  />
                  <div style={{ display: "flex", gap: 2 }}>
                    <button
                      onClick={() => onChange({ ...corr, court_primary: h })}
                      style={{
                        padding: "1px 5px",
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.4)",
                        background:
                          corr.court_primary === h
                            ? "#fff"
                            : "rgba(255,255,255,0.15)",
                        color: corr.court_primary === h ? "#000" : TEXT_PRIMARY,
                        cursor: "pointer",
                      }}
                    >
                      P
                    </button>
                    <button
                      onClick={() => onChange({ ...corr, court_secondary: h })}
                      style={{
                        padding: "1px 5px",
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.4)",
                        background:
                          corr.court_secondary === h
                            ? "#fff"
                            : "rgba(255,255,255,0.15)",
                        color:
                          corr.court_secondary === h ? "#000" : TEXT_PRIMARY,
                        cursor: "pointer",
                      }}
                    >
                      S
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Tournament skin tone filter */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
            Skin Tone Filter
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: TEXT_DIM,
                marginLeft: 8,
              }}
            >
              — filters these colors from all outfit displays
            </span>
          </div>
          <button
            onClick={() => {
              const seen = new Set<string>();
              const merged: string[] = [];
              for (const v of videos) {
                for (const h of v.skin_hex) {
                  const key = h.toUpperCase();
                  if (!seen.has(key)) {
                    seen.add(key);
                    merged.push(h);
                  }
                }
              }
              onChange({ ...corr, skin_tones: merged });
            }}
            style={{
              padding: "3px 10px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "#fff",
              color: "#000",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            Populate from videos
          </button>
          {corr.skin_tones.length > 0 && (
            <button
              onClick={() => onChange({ ...corr, skin_tones: [] })}
              style={{
                padding: "3px 10px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: TEXT_DIM,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Clear
            </button>
          )}
        </div>
        {corr.skin_tones.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {corr.skin_tones.map((h) => (
              <Swatch
                key={h}
                hex={h}
                onRemove={() =>
                  onChange({
                    ...corr,
                    skin_tones: corr.skin_tones.filter((s) => s !== h),
                  })
                }
              />
            ))}
            <AddColorInput
              onAdd={(h) => {
                if (!corr.skin_tones.includes(h))
                  onChange({ ...corr, skin_tones: [...corr.skin_tones, h] });
              }}
              placeholder="Add #hex"
            />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: TEXT_FAINT }}>
            No skin tones set — click "Populate from videos" to auto-fill from
            notebook detections
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────

const ALIGN_ICON: Record<string, string> = {
  ok: "✓",
  swapped: "⇄",
  unknown: "?",
};

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  corr: corrRaw,
  onChange,
  globalSkinFilter,
}) => {
  const corr: VideoCorrection = {
    p1: {
      outfit_add: corrRaw?.p1?.outfit_add ?? [],
      outfit_remove: corrRaw?.p1?.outfit_remove ?? [],
    },
    p2: {
      outfit_add: corrRaw?.p2?.outfit_add ?? [],
      outfit_remove: corrRaw?.p2?.outfit_remove ?? [],
    },
    skin_add: corrRaw?.skin_add ?? [],
    skin_remove: corrRaw?.skin_remove ?? [],
    notes: corrRaw?.notes,
  };
  const [framesOpen, setFramesOpen] = useState(false);
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const [skinDragOver, setSkinDragOver] = useState(false);
  const [skinShowRemoved, setSkinShowRemoved] = useState(false);

  const hasChanges =
    corr.p1.outfit_add.length > 0 ||
    corr.p1.outfit_remove.length > 0 ||
    corr.p2.outfit_add.length > 0 ||
    corr.p2.outfit_remove.length > 0 ||
    corr.skin_add.length > 0 ||
    corr.skin_remove.length > 0;

  const merge = (override: Partial<VideoCorrection>): VideoCorrection => ({
    p1: override.p1 !== undefined ? override.p1 : corr.p1,
    p2: override.p2 !== undefined ? override.p2 : corr.p2,
    skin_add:
      override.skin_add !== undefined ? override.skin_add : corr.skin_add,
    skin_remove:
      override.skin_remove !== undefined
        ? override.skin_remove
        : corr.skin_remove,
    notes: override.notes !== undefined ? override.notes : corr.notes,
  });

  const handleDragStart = (info: DragInfo) => {
    setDrag(info);
    dragRef.current = info;
  };

  const handleDrop = (toPlayer: "p1" | "p2") => {
    const d = dragRef.current;
    if (!d || d.fromPlayer === toPlayer) {
      setDrag(null);
      dragRef.current = null;
      return;
    }

    const srcKey = d.fromPlayer;
    const dstKey = toPlayer;
    const src = srcKey === "p1" ? corr.p1 : corr.p2;
    const dst = dstKey === "p1" ? corr.p1 : corr.p2;

    const newSrc: PlayerCorrection =
      d.type === "detected"
        ? {
            outfit_add: src.outfit_add,
            outfit_remove: [...src.outfit_remove, d.hex],
          }
        : {
            outfit_add: src.outfit_add.filter((h) => h !== d.hex),
            outfit_remove: src.outfit_remove,
          };

    const newDst: PlayerCorrection = dst.outfit_add.includes(d.hex)
      ? dst
      : {
          outfit_add: [...dst.outfit_add, d.hex],
          outfit_remove: dst.outfit_remove,
        };

    onChange(
      merge(
        srcKey === "p1"
          ? { p1: newSrc, p2: newDst }
          : { p1: newDst, p2: newSrc },
      ),
    );
    setDrag(null);
    dragRef.current = null;
  };

  const handleDropOnSkin = () => {
    const d = dragRef.current;
    if (!d) return;
    const src = d.fromPlayer === "p1" ? corr.p1 : corr.p2;
    const newSrc: PlayerCorrection =
      d.type === "detected"
        ? {
            outfit_add: src.outfit_add,
            outfit_remove: [...src.outfit_remove, d.hex],
          }
        : {
            outfit_add: src.outfit_add.filter((h) => h !== d.hex),
            outfit_remove: src.outfit_remove,
          };
    const newSkinAdd = corr.skin_add.includes(d.hex)
      ? corr.skin_add
      : [...corr.skin_add, d.hex];
    onChange(
      merge(
        d.fromPlayer === "p1"
          ? { p1: newSrc, skin_add: newSkinAdd }
          : { p2: newSrc, skin_add: newSkinAdd },
      ),
    );
    setDrag(null);
    dragRef.current = null;
  };

  const addSkin = (hex: string) => {
    if (!corr.skin_add.includes(hex))
      onChange(merge({ skin_add: [...corr.skin_add, hex] }));
  };
  const removeSkinAdd = (hex: string) =>
    onChange(merge({ skin_add: corr.skin_add.filter((h) => h !== hex) }));
  const removeSkinDet = (hex: string) => {
    if (!corr.skin_remove.includes(hex))
      onChange(merge({ skin_remove: [...corr.skin_remove, hex] }));
  };

  return (
    <div
      style={{
        background: CARD_BG,
        border: hasChanges ? CARD_CHANGED : CARD_BORDER,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 14,
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <img
          src={video.thumb_url}
          alt={video.players}
          style={{
            width: 120,
            height: 68,
            objectFit: "cover",
            borderRadius: 6,
            flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              marginBottom: 2,
            }}
          >
            {video.players}
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 6 }}>
            {video.location} &nbsp;·&nbsp; alignment:{" "}
            {ALIGN_ICON[video.alignment] ?? video.alignment}
            &nbsp;·&nbsp;
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: TEXT_FAINT,
              }}
            >
              {video.video_id}
            </span>
          </div>
        </div>
        {video.corrected && (
          <div
            style={{
              fontSize: 10,
              color: "#4CAF50",
              alignSelf: "flex-start",
              marginLeft: "auto",
            }}
          >
            corrected
          </div>
        )}
      </div>

      {/* Players */}
      {drag && (
        <div
          style={{
            fontSize: 10,
            color: TEXT_DIM,
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          dragging{" "}
          <span
            style={{
              background: drag.hex,
              padding: "1px 6px",
              borderRadius: 3,
              color: contrastColor(drag.hex),
            }}
          >
            {drag.hex}
          </span>
          &nbsp;— drop on other player or skin tones to move
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <PlayerSection
          player={video.p1}
          corr={corr.p1}
          playerId="p1"
          onChange={(p1) => onChange(merge({ p1 }))}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          isDragActive={!!drag}
          globalSkinFilter={globalSkinFilter}
        />
        <PlayerSection
          player={video.p2}
          corr={corr.p2}
          playerId="p2"
          onChange={(p2) => onChange(merge({ p2 }))}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          isDragActive={!!drag}
          globalSkinFilter={globalSkinFilter}
        />
      </div>

      {/* Skin exclusions */}
      <div
        style={{ marginBottom: 10 }}
        onDragOver={(e) => {
          if (drag) {
            e.preventDefault();
            setSkinDragOver(true);
          }
        }}
        onDragLeave={() => setSkinDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSkinDragOver(false);
          handleDropOnSkin();
        }}
      >
        <div style={{ fontSize: 10, color: TEXT_FAINT, marginBottom: 5 }}>
          skin tones{" "}
          <span style={{ color: TEXT_FAINT }}>
            — click × to remove, drag outfit here to move
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
            borderRadius: 6,
            padding: "4px 6px",
            border: skinDragOver
              ? `1px dashed ${ACCENT}`
              : "1px solid transparent",
            background: skinDragOver ? "rgba(21,101,192,0.15)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          {video.skin_hex
            .filter((h) => !corr.skin_remove.includes(h))
            .map((h) => (
              <Swatch key={h} hex={h} onRemove={() => removeSkinDet(h)} />
            ))}
          {corr.skin_add.map((h) => (
            <Swatch
              key={`sadd-${h}`}
              hex={h}
              label="+"
              onRemove={() => removeSkinAdd(h)}
            />
          ))}
          {corr.skin_remove.length > 0 && (
            <button
              onClick={() => setSkinShowRemoved((v) => !v)}
              style={{
                fontSize: 10,
                background: "none",
                border: "none",
                color: TEXT_FAINT,
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              {skinShowRemoved ? "▾" : "▸"} {corr.skin_remove.length} removed
            </button>
          )}
          <AddColorInput onAdd={addSkin} placeholder="Add skin #hex" />
        </div>
        {skinShowRemoved && corr.skin_remove.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 6,
              paddingLeft: 4,
              borderLeft: "2px solid rgba(255,255,255,0.1)",
            }}
          >
            {corr.skin_remove.map((h) => (
              <div
                key={h}
                title="Click to restore"
                onClick={() =>
                  onChange(
                    merge({
                      skin_remove: corr.skin_remove.filter((x) => x !== h),
                    }),
                  )
                }
                style={{ cursor: "pointer" }}
              >
                <Swatch hex={h} dim />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Frame samples */}
      {video.frame_paths.length > 0 && (
        <div>
          <button
            onClick={() => setFramesOpen(!framesOpen)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: TEXT_PRIMARY,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: "3px 10px",
              borderRadius: 4,
              minWidth: 80,
              marginBottom: framesOpen ? 8 : 0,
            }}
          >
            {framesOpen ? "▾" : "▸"} {video.frame_paths.length} frame samples
          </button>
          {framesOpen && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {video.frame_paths.map((fp) => {
                const filename = frameFilename(fp);
                const url = `/api/wta/frames/${video.video_id}/${filename}`;
                return (
                  <a
                    key={fp}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open ${filename} in new tab — use DevTools color picker`}
                  >
                    <img
                      src={url}
                      alt={filename}
                      style={{
                        width: 140,
                        height: 79,
                        objectFit: "cover",
                        borderRadius: 5,
                        border: CARD_BORDER,
                      }}
                    />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── TennisCourtDiagram ─────────────────────────────────────────────────────────

const TennisCourtDiagram: React.FC<{
  primary: string | null;
  secondary: string | null;
}> = ({ primary, secondary }) => {
  // Standard court: 78ft long × 36ft wide (doubles)
  // Singles width: 27ft — alleys are 4.5ft each side
  // Net at 39ft (center). Service lines at 18ft and 60ft from left baseline.
  // Center service line at y=18 (width midpoint).
  const SVG_W = 420;
  const SVG_H = 220;
  const PAD = 28;
  const cW = SVG_W - PAD * 2; // 364
  const cH = SVG_H - PAD * 2; // 164

  const sx = cW / 78;
  const sy = cH / 36;
  const px = (v: number) => PAD + v * sx;
  const py = (v: number) => PAD + v * sy;

  const p1 = primary ?? "#2a6db5";
  const p2 = secondary ?? "#1a4f8a";
  const W = "#fff";
  const LW = 1.5;

  // Key coordinates
  const NET_X = 39;
  const SVC_L = 18; // left service line (from left baseline)
  const SVC_R = 60; // right service line
  const SGL_T = 4.5; // singles top sideline
  const SGL_B = 31.5; // singles bottom sideline
  const MID_Y = 18; // center service line (width midpoint)

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ borderRadius: 8, display: "block" }}
    >
      {/* Full court surface — primary color */}
      <rect x={px(0)} y={py(0)} width={cW} height={cH} fill={p1} rx={2} />

      {/* Service boxes — secondary color */}
      <rect
        x={px(SVC_L)}
        y={py(SGL_T)}
        width={(SVC_R - SVC_L) * sx}
        height={(SGL_B - SGL_T) * sy}
        fill={p2}
      />

      {/* ── White lines ── */}
      {/* Outer doubles boundary */}
      <rect
        x={px(0)}
        y={py(0)}
        width={cW}
        height={cH}
        fill="none"
        stroke={W}
        strokeWidth={LW}
      />

      {/* Singles sidelines (full length) */}
      <line
        x1={px(0)}
        y1={py(SGL_T)}
        x2={px(78)}
        y2={py(SGL_T)}
        stroke={W}
        strokeWidth={LW}
      />
      <line
        x1={px(0)}
        y1={py(SGL_B)}
        x2={px(78)}
        y2={py(SGL_B)}
        stroke={W}
        strokeWidth={LW}
      />

      {/* Service lines */}
      <line
        x1={px(SVC_L)}
        y1={py(SGL_T)}
        x2={px(SVC_L)}
        y2={py(SGL_B)}
        stroke={W}
        strokeWidth={LW}
      />
      <line
        x1={px(SVC_R)}
        y1={py(SGL_T)}
        x2={px(SVC_R)}
        y2={py(SGL_B)}
        stroke={W}
        strokeWidth={LW}
      />

      {/* Center service line */}
      <line
        x1={px(SVC_L)}
        y1={py(MID_Y)}
        x2={px(SVC_R)}
        y2={py(MID_Y)}
        stroke={W}
        strokeWidth={LW}
      />

      {/* Center marks on baselines */}
      <line
        x1={px(0)}
        y1={py(MID_Y - 0.6)}
        x2={px(0)}
        y2={py(MID_Y + 0.6)}
        stroke={W}
        strokeWidth={LW + 0.5}
      />
      <line
        x1={px(78)}
        y1={py(MID_Y - 0.6)}
        x2={px(78)}
        y2={py(MID_Y + 0.6)}
        stroke={W}
        strokeWidth={LW + 0.5}
      />

      {/* Net — solid white, slightly thicker */}
      <line
        x1={px(NET_X)}
        y1={py(0)}
        x2={px(NET_X)}
        y2={py(36)}
        stroke={W}
        strokeWidth={2.5}
      />
      {/* Net posts just outside court width */}
      <circle cx={px(NET_X)} cy={py(0) - 4} r={3} fill={W} />
      <circle cx={px(NET_X)} cy={py(36) + 4} r={3} fill={W} />
    </svg>
  );
};

// ── PresentationCard ───────────────────────────────────────────────────────────

function effectiveOutfit(
  player: WtaPlayer,
  pc: PlayerCorrection,
  skinFilter: string[] = [],
): string[] {
  const skinSet = new Set(skinFilter.map((h) => h.toUpperCase()));
  return [
    ...player.outfit.filter(
      (h) => !pc.outfit_remove.includes(h) && !skinSet.has(h.toUpperCase()),
    ),
    ...pc.outfit_add.filter((h) => !skinSet.has(h.toUpperCase())),
  ];
}

const PresentationCard: React.FC<{
  video: WtaVideo;
  corr: VideoCorrection;
  courtPrimary: string | null;
  courtSecondary: string | null;
  skinFilter: string[];
}> = ({ video, corr, courtPrimary, courtSecondary, skinFilter }) => {
  const bg = courtPrimary ? `${courtPrimary}44` : CARD_BG;
  const border = courtSecondary ? `1px solid ${courtSecondary}bb` : CARD_BORDER;
  const p1Colors = effectiveOutfit(video.p1, corr.p1, skinFilter);
  const p2Colors = effectiveOutfit(video.p2, corr.p2, skinFilter);

  return (
    <div
      style={{
        background: bg,
        border,
        borderRadius: 10,
        padding: "16px 18px",
        marginBottom: 14,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <img
          src={video.thumb_url}
          alt={video.players}
          style={{
            width: 160,
            height: 90,
            objectFit: "cover",
            borderRadius: 6,
            flexShrink: 0,
            border: courtSecondary
              ? `1px solid ${courtSecondary}88`
              : "1px solid rgba(255,255,255,0.2)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: TEXT_PRIMARY,
              marginBottom: 2,
            }}
          >
            {video.players}
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 14 }}>
            {video.location}
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {(
              [
                ["p1", video.p1, p1Colors],
                ["p2", video.p2, p2Colors],
              ] as const
            ).map(([key, player, colors]) => (
              <div key={key}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#90CAF9",
                    fontWeight: 700,
                    marginBottom: 7,
                  }}
                >
                  {player.name}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {colors.length > 0 ? (
                    colors.map((h) => <Swatch key={h} hex={h} />)
                  ) : (
                    <span style={{ fontSize: 10, color: TEXT_FAINT }}>
                      no colors
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const WtaCorrections: React.FC = () => {
  const [videos, setVideos] = useState<WtaVideo[]>([]);
  const [runTs, setRunTs] = useState<string | null>(null);
  const [pending, setPending] = useState<Corrections>({});
  const [globalCorr, setGlobalCorr] = useState<GlobalCourtCorr>({
    court_primary: null,
    court_secondary: null,
    skin_tones: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "present">("edit");
  const [propagationLog, setPropagationLog] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/wta/latest").then((r) => r.json()),
      fetch("/api/wta/corrections").then((r) => r.json()),
    ])
      .then(([latest, corrections]) => {
        setVideos(latest.videos ?? []);
        setRunTs(latest.run_ts ?? null);
        const existing: Corrections = {};
        const raw = corrections as Record<string, unknown>;
        for (const [vid, corr] of Object.entries(raw)) {
          if (!vid.startsWith("_")) existing[vid] = normalizeCorr(corr);
        }
        setPending(existing);
        const g = (raw["_global"] ?? {}) as Record<string, unknown>;
        setGlobalCorr({
          court_primary: (g.court_primary as string) ?? null,
          court_secondary: (g.court_secondary as string) ?? null,
          skin_tones: (g.skin_tones as string[]) ?? [],
        });
      })
      .catch(() =>
        setError("Failed to load WTA data — is the backend running?"),
      );
  }, []);

  const getCorr = useCallback(
    (vid_id: string): VideoCorrection => {
      const saved = pending[vid_id];
      if (!saved) return emptyVideoCorr();
      return normalizeCorr(saved);
    },
    [pending],
  );

  const setCorr = useCallback(
    (vid_id: string, corr: VideoCorrection, sourceVideo: WtaVideo) => {
      setSaved(false);
      setPropagationLog([]);
      setPending((prev) => {
        const oldCorr = normalizeCorr(prev[vid_id]);
        const next: Corrections = { ...prev, [vid_id]: corr };
        const propagated: string[] = [];

        for (const other of videos) {
          if (other.video_id === vid_id) continue;
          const otherCorr = normalizeCorr(prev[other.video_id]);
          let newP1 = otherCorr.p1;
          let newP2 = otherCorr.p2;

          for (const srcSlot of ["p1", "p2"] as const) {
            const srcName = sourceVideo[srcSlot].name;
            const oldSrcPlayerCorr = oldCorr[srcSlot];
            const newSrcPlayerCorr = corr[srcSlot];
            for (const dstSlot of ["p1", "p2"] as const) {
              if (!samePlayerName(srcName, other[dstSlot].name)) continue;
              const updated = propagatePlayerCorr(
                dstSlot === "p1" ? newP1 : newP2,
                oldSrcPlayerCorr,
                newSrcPlayerCorr,
              );
              if (
                playerCorrChanged(updated, dstSlot === "p1" ? newP1 : newP2)
              ) {
                if (dstSlot === "p1") newP1 = updated;
                else newP2 = updated;
              }
            }
          }

          if (
            playerCorrChanged(newP1, otherCorr.p1) ||
            playerCorrChanged(newP2, otherCorr.p2)
          ) {
            next[other.video_id] = { ...otherCorr, p1: newP1, p2: newP2 };
            propagated.push(other.video_id);
          }
        }

        if (propagated.length > 0) {
          Promise.resolve().then(() => setPropagationLog(propagated));
        }
        return next;
      });
    },
    [videos],
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    const body = JSON.stringify({ ...pending, _global: globalCorr });
    const opts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    };
    try {
      let res = await fetchWithCsrf("/api/wta/corrections", opts);
      if (res.status === 403) {
        const data = (await res.json().catch(() => ({}))) as { code?: string };
        if (data.code === "CSRF_VALIDATION_FAILED") {
          await csrfService.refreshToken();
          res = await fetchWithCsrf("/api/wta/corrections", opts);
        }
      }
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const allCourtHex = [...new Set(videos.flatMap((v) => v.court_hex))];

  const pendingCount = Object.values(pending).filter(
    (c) =>
      (c?.p1?.outfit_add?.length ?? 0) +
        (c?.p1?.outfit_remove?.length ?? 0) +
        (c?.p2?.outfit_add?.length ?? 0) +
        (c?.p2?.outfit_remove?.length ?? 0) +
        (c?.skin_add?.length ?? 0) +
        (c?.skin_remove?.length ?? 0) >
      0,
  ).length;

  return (
    <div
      style={{
        maxWidth: 940,
        margin: "0 auto",
        padding: "24px 16px",
        color: TEXT_PRIMARY,
        background: "#00000078",
        backdropFilter: "blur(2px)",
        fontWeight: 700,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: TEXT_PRIMARY,
              marginBottom: 3,
            }}
          >
            {viewMode === "present"
              ? "WTA Swatch Master"
              : "WTA Outfit Corrections"}
          </div>
          {runTs && (
            <div style={{ fontSize: 11, color: TEXT_DIM }}>
              Last run: {new Date(runTs).toLocaleString()} &nbsp;·&nbsp;{" "}
              {videos.length} videos
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && (
            <span style={{ fontSize: 12, color: "#4CAF50" }}>saved</span>
          )}
          {error && (
            <span style={{ fontSize: 12, color: "#e53935" }}>{error}</span>
          )}
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.3)",
              overflow: "hidden",
            }}
          >
            {(["edit", "present"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "7px 14px",
                  border: "none",
                  background:
                    viewMode === mode ? "#fff" : "rgba(255,255,255,0.1)",
                  color: viewMode === mode ? "#000" : TEXT_PRIMARY,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
          {viewMode === "edit" && (
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "7px 18px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "#fff",
                color: "#000",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
                minWidth: 160,
              }}
            >
              {saving
                ? "Saving…"
                : `Save corrections${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
            </button>
          )}
        </div>
      </div>

      {viewMode === "edit" && propagationLog.length > 0 && (
        <div
          style={{
            background: "rgba(21,101,192,0.2)",
            border: "1px solid rgba(21,101,192,0.6)",
            borderRadius: 6,
            padding: "7px 14px",
            fontSize: 11,
            color: "#90CAF9",
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            Auto-propagated to {propagationLog.length} other match
            {propagationLog.length > 1 ? "es" : ""}
          </span>
          <button
            onClick={() => setPropagationLog([])}
            style={{
              background: "none",
              border: "none",
              color: "#90CAF9",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {viewMode === "edit" && (
        <>
          {/* Instructions */}
          <div
            style={{
              background: "#ffffff11",
              border: CARD_BORDER,
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12,
              color: TEXT_DIM,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: TEXT_PRIMARY }}>How to use:</strong> Click a
            swatch × to remove it. Drag a swatch to the other player or skin
            tones to move it. Use + to add a hex. Open frame samples →
            right-click in Chrome DevTools to pick colors.
          </div>

          {/* Global court colors */}
          {videos.length > 0 && (
            <GlobalCourtSection
              detectedHex={allCourtHex}
              corr={globalCorr}
              onChange={(c) => {
                setSaved(false);
                setGlobalCorr(c);
              }}
              videos={videos}
            />
          )}
        </>
      )}

      {videos.length === 0 && (
        <div
          style={{
            color: TEXT_DIM,
            textAlign: "center",
            marginTop: 60,
            background: CARD_BG,
            border: CARD_BORDER,
            borderRadius: 10,
            padding: 40,
          }}
        >
          No results yet — run the notebook first to generate wta_latest.json
        </div>
      )}

      {viewMode === "present" && videos.length > 0 && (
        <>
          {videos[0]?.location && (
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: TEXT_PRIMARY,
                letterSpacing: 1,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              {parseVenueName(videos[0].location)}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
              marginBottom: 24,
              padding: "14px 18px",
              background: CARD_BG,
              borderRadius: 10,
              border: CARD_BORDER,
              backdropFilter: "blur(6px)",
            }}
          >
            <TennisCourtDiagram
              primary={globalCorr.court_primary}
              secondary={globalCorr.court_secondary}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {globalCorr.court_primary && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Swatch hex={globalCorr.court_primary} />
                  <span
                    style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 700 }}
                  >
                    Primary surface
                  </span>
                </div>
              )}
              {globalCorr.court_secondary && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Swatch hex={globalCorr.court_secondary} />
                  <span
                    style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 700 }}
                  >
                    Service boxes
                  </span>
                </div>
              )}
              {!globalCorr.court_primary && !globalCorr.court_secondary && (
                <span style={{ fontSize: 11, color: TEXT_FAINT }}>
                  No court colors set — switch to Edit to configure
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === "present" &&
        videos.length > 0 &&
        (() => {
          const skinTones = new Set<string>(
            globalCorr.skin_tones.map((h) => h.toUpperCase()),
          );
          const seen = new Set<string>();
          const unique: string[] = [];
          for (const v of videos) {
            const c = getCorr(v.video_id);
            for (const raw of [
              ...effectiveOutfit(v.p1, c.p1, globalCorr.skin_tones),
              ...effectiveOutfit(v.p2, c.p2, globalCorr.skin_tones),
            ]) {
              const h = collapseNearBlack(raw);
              const key = h.toUpperCase();
              if (!seen.has(key) && !skinTones.has(key)) {
                seen.add(key);
                unique.push(h);
              }
            }
          }
          const courtPrimaryColor = globalCorr.court_primary ?? "#ccc";
          const paletteBorder = `3px solid ${courtPrimaryColor}`;
          return unique.length > 0 ? (
            <div
              style={{
                background: "#fff",
                border: paletteBorder,
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                Tournament Palette
              </div>
              <FlowerPalette
                colors={unique}
                centerColor={globalCorr.court_primary ?? "#e0e0e0"}
              />
            </div>
          ) : null;
        })()}

      {videos.map((v) =>
        viewMode === "present" ? (
          <PresentationCard
            key={v.video_id}
            video={v}
            corr={getCorr(v.video_id)}
            courtPrimary={globalCorr.court_primary}
            courtSecondary={globalCorr.court_secondary}
            skinFilter={globalCorr.skin_tones}
          />
        ) : (
          <div key={v.video_id} style={{ position: "relative" }}>
            {propagationLog.includes(v.video_id) && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 1,
                  fontSize: 10,
                  color: "#90CAF9",
                  background: "rgba(21,101,192,0.25)",
                  border: "1px solid rgba(21,101,192,0.5)",
                  borderRadius: 4,
                  padding: "2px 7px",
                  fontWeight: 700,
                  pointerEvents: "none",
                }}
              >
                auto-updated
              </div>
            )}
            <VideoCard
              video={v}
              corr={getCorr(v.video_id)}
              onChange={(c) => setCorr(v.video_id, c, v)}
              globalSkinFilter={globalCorr.skin_tones}
            />
          </div>
        ),
      )}
    </div>
  );
};

export default WtaCorrections;
