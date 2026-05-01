"use client";

import { useEffect, useMemo, useState } from "react";
import WALKS from "./data/walks.json";
import { MapViewClient } from "./MapViewClient";

const T = {
  cream: "#F5F0E8",
  parchment: "#EDE6D6",
  rust: "#C04B2C",
  rustLight: "#E8633E",
  rustDark: "#9E3A20",
  forest: "#2A4D3E",
  forestMid: "#3D6B57",
  sand: "#B8A98A",
  sandLight: "#D6CCBA",
  ink: "#1C1916",
  inkMid: "#3D3830",
  inkLight: "#6B6358",
  white: "#FDFAF5",
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Outfit', -apple-system, sans-serif",
};

const THEME_CFG = {
  Architecture: { c: "#4A6741", bg: "#E4EDE3" },
  History: { c: "#7A4A2A", bg: "#F2E5DA" },
  Community: { c: "#2A5A6B", bg: "#DDF0EF" },
  Arts: { c: "#7A3A6B", bg: "#F0E0EC" },
  Environment: { c: "#3D6B3A", bg: "#E3EFE2" },
  Advocacy: { c: "#C04B2C", bg: "#FAE0D9" },
  Transit: { c: "#3A4A7A", bg: "#E0E5F5" },
  Accessibility: { c: "#6B4A2A", bg: "#F0E8DE" },
  Engineering: { c: "#4A4A6A", bg: "#E8E8F2" },
};
const ALL_THEMES = [...new Set(WALKS.flatMap((w) => w.themes))].sort();
const TIME_SLOTS = ["Morning (before noon)", "Afternoon (noon–5 PM)", "Evening (5 PM+)"];
function timeCat(ts) {
  return ts < 720 ? "Morning (before noon)" : ts < 1020 ? "Afternoon (noon–5 PM)" : "Evening (5 PM+)";
}
const DAYS = [
  { id: "", label: "All days" },
  { id: "Friday", label: "Fri May 1" },
  { id: "Saturday", label: "Sat May 2" },
  { id: "Sunday", label: "Sun May 3" },
];
const DAY_ORDER = { Friday: 0, Saturday: 1, Sunday: 2 };
function walkSort(a, b) {
  const da = DAY_ORDER[dayKey(a.date)] ?? 3;
  const db = DAY_ORDER[dayKey(b.date)] ?? 3;
  if (da !== db) return da - db;
  return a.timeSort - b.timeSort;
}
function dayKey(dateStr) {
  const s = String(dateStr || "").trim();
  if (/^Friday\b/i.test(s)) return "Friday";
  if (/^Saturday\b/i.test(s)) return "Saturday";
  if (/^Sunday\b/i.test(s)) return "Sunday";
  return "";
}
function dayLabel(dateStr) {
  const k = dayKey(dateStr);
  if (k === "Friday") return "Fri";
  if (k === "Saturday") return "Sat";
  if (k === "Sunday") return "Sun";
  return "";
}
function dur(m) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

const DAY_DATE = { Friday: 1, Saturday: 2, Sunday: 3 }; // May 2026
function isOver(walk) {
  const dayNum = DAY_DATE[dayKey(walk.date)];
  if (!dayNum) return false;
  const endMin = walk.timeSort + (walk.duration || 0);
  const end = new Date(2026, 4, dayNum, Math.floor(endMin / 60), endMin % 60);
  return Date.now() > end.getTime();
}
function isStarted(walk) {
  const dayNum = DAY_DATE[dayKey(walk.date)];
  if (!dayNum) return false;
  const start = new Date(2026, 4, dayNum, Math.floor(walk.timeSort / 60), walk.timeSort % 60);
  return Date.now() > start.getTime();
}

function Loop({ size = 40, color = T.rust, op = 0.15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity: op, display: "block" }}>
      <path
        d="M40 8 C12 8 12 40 40 40 C68 40 68 72 40 72 C12 72 12 40 40 40"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="40" cy="8" r="6" fill={color} />
      <circle cx="40" cy="72" r="6" fill={color} />
    </svg>
  );
}

function ThemePill({ theme, small = false }) {
  const cfg = THEME_CFG[theme] || { c: T.inkLight, bg: T.parchment };
  return (
    <span
      style={{
        fontSize: small ? "9px" : "11px",
        fontWeight: "700",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: T.sans,
        color: cfg.c,
        background: cfg.bg,
        borderRadius: "6px",
        padding: small ? "2px 7px" : "3px 9px",
      }}
    >
      {theme}
    </span>
  );
}

function WalkCard({ walk, starred, onToggle, onOpen, idx }) {
  const [pressed, setPressed] = useState(false);
  const over = isOver(walk);
  const inProgress = !over && isStarted(walk);
  return (
    <div
      onClick={() => onOpen(walk)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: over ? "#F8F6F2" : T.white,
        borderRadius: "22px",
        padding: "18px 17px 16px",
        marginBottom: "11px",
        cursor: "pointer",
        border: starred ? `2px solid ${T.rust}` : `1.5px solid ${T.parchment}`,
        boxShadow: starred
          ? `0 8px 32px rgba(192,75,44,0.13), 0 2px 8px rgba(192,75,44,0.07)`
          : `0 3px 14px rgba(28,25,22,0.06)`,
        position: "relative",
        overflow: "hidden",
        animation: "fadeUp 0.4s ease both",
        animationDelay: `${idx * 30}ms`,
        transform: pressed ? "scale(0.982)" : "scale(1)",
        transition: "transform 0.12s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        opacity: over ? 0.6 : 1,
      }}
    >
      {starred && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: "3.5px",
            borderRadius: "0 3px 3px 0",
            background: `linear-gradient(${T.rustLight}, ${T.rustDark})`,
          }}
        />
      )}
      <div style={{ position: "absolute", right: "-8px", bottom: "-8px", pointerEvents: "none" }}>
        <Loop size={64} color={starred ? T.rust : T.forest} op={0.06} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "11px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
          {!!dayLabel(walk.date) && (
            <span
              style={{
                background: over ? T.sandLight : T.inkMid,
                color: T.white,
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.05em",
                borderRadius: "999px",
                padding: "4px 11px",
                fontFamily: T.sans,
              }}
            >
              {dayLabel(walk.date)}
            </span>
          )}
          <span
            style={{
              background: over
                ? T.sandLight
                : walk.timeSort >= 1020
                ? `linear-gradient(135deg, ${T.inkMid}, #5A5248)`
                : `linear-gradient(135deg, ${T.forest}, ${T.forestMid})`,
              color: T.white,
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.04em",
              borderRadius: "999px",
              padding: "4px 11px",
              fontFamily: T.sans,
            }}
          >
            {walk.time}
          </span>
          <span style={{ fontSize: "12px", color: T.inkLight, fontFamily: T.sans, fontWeight: "600" }}>{dur(walk.duration)}</span>
          {inProgress && (
            <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.05em", fontFamily: T.sans, color: "#2A7A3E", background: "#E3F5E8", borderRadius: "999px", padding: "3px 9px" }}>
              ● In progress
            </span>
          )}
          {over && (
            <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.05em", fontFamily: T.sans, color: T.inkLight, background: T.parchment, borderRadius: "999px", padding: "3px 9px" }}>
              Ended
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(walk.id);
          }}
          style={{
            background: starred ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})` : T.parchment,
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "17px",
            flexShrink: 0,
            color: starred ? T.white : T.sand,
            transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            transform: starred ? "scale(1.05)" : "scale(1)",
            boxShadow: starred ? `0 4px 14px rgba(192,75,44,0.3)` : "none",
          }}
        >
          {starred ? "★" : "☆"}
        </button>
      </div>

      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "18px",
          fontWeight: "700",
          fontFamily: T.serif,
          color: T.ink,
          lineHeight: "1.3",
          paddingRight: "4px",
        }}
      >
        {walk.title}
      </h3>

      <div
        style={{
          fontSize: "12px",
          color: T.inkLight,
          fontFamily: T.sans,
          marginBottom: "12px",
          lineHeight: "1.4",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          fontWeight: "500",
        }}
      >
        📍 {walk.start || walk.neighbourhood || "TBA"}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {walk.themes.slice(0, 3).map((t) => <ThemePill key={t} theme={t} />)}
      </div>
    </div>
  );
}

function DetailSheet({ walk, starred, onToggle, onClose }) {
  if (!walk) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(28,25,22,0.6)",
        display: "flex",
        alignItems: "flex-end",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.cream,
          width: "100%",
          maxWidth: "430px",
          margin: "0 auto",
          borderRadius: "30px 30px 0 0",
          maxHeight: "93vh",
          overflowY: "auto",
          animation: "slideUp 0.32s cubic-bezier(0.22,1.2,0.36,1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
          <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: T.sandLight }} />
        </div>

        {/* Header section with gradient */}
        <div
          style={{
            margin: "8px 16px 0",
            background: `linear-gradient(145deg, ${T.forest} 0%, #1A3228 100%)`,
            borderRadius: "22px",
            padding: "20px 20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: "-12px", top: "-12px", opacity: 0.12, pointerEvents: "none" }}>
            <Loop size={120} color={T.white} op={1} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", position: "relative", zIndex: 1 }}>
            <button
              onClick={onClose}
              style={{
                background: "rgba(253,250,245,0.12)",
                border: "1.5px solid rgba(253,250,245,0.2)",
                borderRadius: "20px",
                padding: "7px 18px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(253,250,245,0.85)",
                fontFamily: T.sans,
                backdropFilter: "blur(4px)",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => onToggle(walk.id)}
              style={{
                background: starred ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})` : "rgba(253,250,245,0.12)",
                border: `1.5px solid ${starred ? "transparent" : "rgba(253,250,245,0.2)"}`,
                color: T.white,
                borderRadius: "20px",
                padding: "7px 18px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                fontFamily: T.sans,
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: starred ? `0 4px 16px rgba(192,75,44,0.4)` : "none",
              }}
            >
              {starred ? "★ Saved" : "☆ Save"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px", position: "relative", zIndex: 1 }}>
            {walk.themes.map((t) => {
              const cfg = THEME_CFG[t] || { c: T.inkLight, bg: T.parchment };
              return (
                <span
                  key={t}
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    fontFamily: T.sans,
                    color: cfg.c,
                    background: cfg.bg,
                    borderRadius: "6px",
                    padding: "3px 9px",
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "25px",
              fontWeight: "700",
              fontFamily: T.serif,
              color: T.white,
              lineHeight: "1.25",
              position: "relative",
              zIndex: 1,
            }}
          >
            {walk.title}
          </h2>
        </div>

        {/* Info grid */}
        <div
          style={{
            margin: "12px 16px",
            background: T.white,
            borderRadius: "18px",
            padding: "16px 18px",
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "8px",
            border: `1.5px solid ${T.parchment}`,
          }}
        >
          {[["📅", "Date", walk.date], ["🕐", "Starts", walk.time], ["⏱", "Length", dur(walk.duration)]].map(([ico, lbl, val]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: T.inkLight, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                {ico} {lbl}
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: T.ink, fontFamily: T.sans }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 16px 36px" }}>
          <p style={{ fontSize: "14px", lineHeight: "1.8", color: T.inkMid, fontFamily: T.sans, margin: "0 0 20px" }}>{walk.summary}</p>

          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.09em", color: T.inkLight, fontFamily: T.sans, marginBottom: "5px" }}>Led by</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: T.ink, fontFamily: T.sans }}>{walk.leaders}</div>
            {walk.org && <div style={{ fontSize: "13px", color: T.inkLight, fontFamily: T.sans, marginTop: "3px" }}>{walk.org}</div>}
          </div>

          <div style={{ marginBottom: "20px", background: T.white, borderRadius: "18px", overflow: "hidden", border: `1.5px solid ${T.parchment}` }}>
            <div style={{ padding: "14px 16px", borderBottom: `1.5px solid ${T.parchment}` }}>
              <div style={{ fontSize: "10px", color: T.forestMid, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.sans, fontWeight: "700", marginBottom: "5px" }}>
                🟢 Meeting point
              </div>
              <div style={{ fontSize: "13px", color: T.ink, fontFamily: T.sans, lineHeight: "1.5" }}>{walk.start || "TBA"}</div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: T.rust, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.sans, fontWeight: "700", marginBottom: "5px" }}>
                🔴 Walk ends
              </div>
              <div style={{ fontSize: "13px", color: T.ink, fontFamily: T.sans, lineHeight: "1.5" }}>{walk.end || "TBA"}</div>
            </div>
          </div>

          {walk.tags.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.09em", color: T.inkLight, fontFamily: T.sans, marginBottom: "8px" }}>Notes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {walk.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: "12px", background: T.parchment, borderRadius: "8px", padding: "5px 11px", color: T.inkMid, fontFamily: T.sans, fontWeight: "600" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <a
            href={walk.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              background: `linear-gradient(135deg, ${T.rust} 0%, ${T.rustLight} 100%)`,
              color: T.white,
              borderRadius: "16px",
              padding: "17px",
              fontWeight: "800",
              fontSize: "15px",
              textDecoration: "none",
              fontFamily: T.sans,
              letterSpacing: "0.02em",
              boxShadow: `0 6px 24px rgba(192,75,44,0.28)`,
            }}
          >
            View on Jane's Walk website →
          </a>
        </div>
      </div>
    </div>
  );
}

function MapView({ walks, starred, onOpen, onToggle }) {
  const mappable = useMemo(() => walks.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)), [walks]);
  const unmapped = useMemo(() => walks.filter((w) => !(Number.isFinite(w.lat) && Number.isFinite(w.lng))), [walks]);
  if (mappable.length === 0) {
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <Loop size={72} color={T.forest} op={0.18} />
        </div>
        <h3 style={{ fontFamily: T.serif, fontSize: "24px", color: T.ink, margin: "0 0 10px" }}>No walks to show</h3>
        <p style={{ color: T.inkLight, fontSize: "14px", lineHeight: "1.65", fontFamily: T.sans, margin: 0 }}>
          Try a different day filter.
        </p>
      </div>
    );
  }
  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: "12px", color: T.inkLight, textAlign: "center", marginBottom: "10px", fontFamily: T.sans, fontWeight: "600" }}>
        Tap a pin to preview · ★ = saved · {mappable.length} walks
      </div>
      <div style={{ borderRadius: "22px", overflow: "hidden", border: `1.5px solid ${T.parchment}`, boxShadow: `0 6px 28px rgba(28,25,22,0.09)` }}>
        <MapViewClient points={mappable} starred={starred} onOpen={onOpen} onToggle={onToggle} />
      </div>
      <div style={{ fontSize: "11px", color: T.inkLight, fontFamily: T.sans, marginTop: "8px", textAlign: "center" }}>
        Map data ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: T.inkLight }}>
          OpenStreetMap contributors
        </a>
      </div>
      <div style={{ marginTop: "16px" }}>
        {mappable.map((w) => {
          const isStarred = starred.has(w.id);
          const dl = dayLabel(w.date);
          return (
            <div
              key={w.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 15px",
                background: T.white,
                borderRadius: "16px",
                marginBottom: "8px",
                border: isStarred ? `2px solid ${T.rust}` : `1.5px solid ${T.parchment}`,
                boxShadow: isStarred ? `0 4px 16px rgba(192,75,44,0.1)` : "none",
                transition: "box-shadow 0.2s ease",
              }}
            >
              <div
                onClick={() => onOpen(w)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: isStarred
                    ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})`
                    : T.forest,
                  color: T.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "800",
                  flexShrink: 0,
                  fontFamily: T.sans,
                  cursor: "pointer",
                  boxShadow: isStarred ? `0 3px 10px rgba(192,75,44,0.3)` : "none",
                }}
              >
                {isStarred ? "★" : "●"}
              </div>
              <div onClick={() => onOpen(w)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: T.ink, fontFamily: T.serif, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {w.title}
                </div>
                <div style={{ fontSize: "11px", color: T.inkLight, fontFamily: T.sans, fontWeight: "500" }}>
                  {dl && <span style={{ color: T.inkMid, fontWeight: "700", marginRight: "4px" }}>{dl}</span>}
                  {w.time} · {w.neighbourhood || w.start?.split(",")[0] || ""}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(w.id); }}
                style={{
                  background: isStarred ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})` : T.parchment,
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  color: isStarred ? T.white : T.sand,
                  flexShrink: 0,
                  transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: isStarred ? "scale(1.05)" : "scale(1)",
                  boxShadow: isStarred ? `0 3px 10px rgba(192,75,44,0.28)` : "none",
                }}
              >
                {isStarred ? "★" : "☆"}
              </button>
            </div>
          );
        })}
        {unmapped.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.09em", color: T.inkLight, fontFamily: T.sans, margin: "10px 4px 8px" }}>
              Not mapped yet ({unmapped.length})
            </div>
            {unmapped.map((w) => (
              <div
                key={w.id}
                onClick={() => onOpen(w)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 15px",
                  background: "rgba(253,250,245,0.65)",
                  borderRadius: "16px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  border: `1.5px dashed ${T.parchment}`,
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: T.sandLight,
                    color: T.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "800",
                    flexShrink: 0,
                    fontFamily: T.sans,
                  }}
                >
                  ?
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: T.ink, fontFamily: T.serif, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                  <div style={{ fontSize: "11px", color: T.inkLight, fontFamily: T.sans }}>
                    {w.time} · {w.start || w.neighbourhood || "TBA"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleView({ walks, starred, onOpen, onToggle }) {
  const saved = walks
    .filter((w) => starred.has(w.id))
    .sort(walkSort);
  if (!saved.length)
    return (
      <div style={{ padding: "72px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <Loop size={80} color={T.rust} op={0.18} />
        </div>
        <h3 style={{ fontFamily: T.serif, fontSize: "26px", color: T.ink, margin: "0 0 12px" }}>Your weekend is empty</h3>
        <p style={{ color: T.inkLight, fontSize: "14px", lineHeight: "1.7", fontFamily: T.sans, margin: 0 }}>
          Star walks from Explore or Map to build your my Jane&apos;s Walk schedule.
        </p>
      </div>
    );
  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          background: `linear-gradient(145deg, ${T.forest} 0%, #162C24 100%)`,
          borderRadius: "22px",
          padding: "22px 22px 20px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 8px 32px rgba(42,77,62,0.28)`,
        }}
      >
        <div style={{ position: "absolute", right: "-12px", top: "-12px", opacity: 0.1, pointerEvents: "none" }}>
          <Loop size={130} color={T.white} op={1} />
        </div>
        <div style={{ fontSize: "10px", color: "rgba(253,250,245,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: T.sans, fontWeight: "700", marginBottom: "6px" }}>
          Your my Jane&apos;s Walk Weekend
        </div>
        <div style={{ fontFamily: T.serif, fontSize: "32px", fontWeight: "700", color: T.white, marginBottom: "6px", lineHeight: "1.1" }}>
          {saved.length} walk{saved.length !== 1 ? "s" : ""} planned
        </div>
        <div style={{ fontSize: "13px", color: "rgba(253,250,245,0.65)", fontFamily: T.sans, fontWeight: "500" }}>
          ~{Math.round((saved.reduce((s, w) => s + w.duration, 0) / 60) * 10) / 10} hours · {Array.from(new Set(saved.map((w) => w.date))).join(" · ")}
        </div>
      </div>
      {saved.map((walk, i) => (
        <div key={walk.id} style={{ display: "flex", gap: "10px" }}>
          {/* Timeline spine */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "20px", flexShrink: 0 }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.rust}, ${T.rustLight})`,
                border: `3px solid ${T.cream}`,
                boxShadow: `0 0 0 2px ${T.rust}`,
                flexShrink: 0,
                marginTop: "26px",
              }}
            />
            {i < saved.length - 1 && (
              <div
                style={{
                  flex: 1,
                  width: "2px",
                  background: `linear-gradient(${T.rust}, ${T.sandLight})`,
                  marginTop: "4px",
                  minHeight: "16px",
                }}
              />
            )}
          </div>
          {/* Reuse the same card as Explore */}
          <div style={{ flex: 1 }}>
            <WalkCard walk={walk} starred={true} onToggle={onToggle} onOpen={onOpen} idx={i} />
          </div>
        </div>
      ))}
    </div>
  );
}

function JanesWalkApp() {
  const [tab, setTab] = useState("explore");
  const [search, setSrch] = useState("");
  const [themes, setThemes] = useState([]);
  const [tslot, setTslot] = useState("");
  const [day, setDay] = useState("");
  const [starred, setStar] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [filters, showFilt] = useState(false);
  const [showEnded, setShowEnded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("janeswalk.starred");
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return;
      setStar(new Set(ids.filter((x) => x !== null && x !== undefined)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("janeswalk.starred", JSON.stringify(Array.from(starred)));
    } catch {
      // ignore
    }
  }, [starred]);

  const toggleStar = (id) =>
    setStar((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const togTheme = (t) => setThemes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return WALKS.filter((w) => {
      if (day && dayKey(w.date) !== day) return false;
      if (q && ![w.title, w.summary, w.neighbourhood, w.leaders].some((s) => s.toLowerCase().includes(q))) return false;
      if (themes.length && !themes.some((t) => w.themes.includes(t))) return false;
      if (tslot && timeCat(w.timeSort) !== tslot) return false;
      return true;
    }).sort(walkSort);
  }, [search, themes, tslot, day]);

  const endedCount = useMemo(() => filtered.filter(isOver).length, [filtered]);
  const visibleWalks = useMemo(
    () => showEnded ? filtered : filtered.filter((w) => !isOver(w)),
    [filtered, showEnded],
  );

  const walksForMap = useMemo(() => {
    return WALKS.filter((w) => (!day ? true : dayKey(w.date) === day)).sort(walkSort);
  }, [day]);

  const nFilters = themes.length + (tslot ? 1 : 0);

  return (
    <div style={{ fontFamily: T.sans, background: T.cream, minHeight: "100vh", maxWidth: "430px", margin: "0 auto", position: "relative" }}>

      {/* Sticky header */}
      <div
        style={{
          background: T.white,
          padding: "16px 18px 0",
          borderBottom: `1.5px solid ${T.parchment}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: `0 2px 16px rgba(28,25,22,0.05)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <Loop size={36} color={T.rust} op={0.9} />
            <div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", color: T.inkLight, fontFamily: T.sans, fontWeight: "800", marginBottom: "1px" }}>
                Our Streets · Our Stories
              </div>
              <div style={{ fontFamily: T.serif, fontSize: "23px", fontWeight: "700", color: T.ink, lineHeight: "1.05" }}>
                my <span style={{ color: T.rust }}>Jane&apos;s</span> Walk <span style={{ fontSize: "15px", color: T.inkLight, fontWeight: "600" }}>Toronto</span>
              </div>
            </div>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${T.rust}, ${T.rustLight})`,
              color: T.white,
              borderRadius: "20px",
              padding: "5px 13px",
              fontSize: "11px",
              fontWeight: "800",
              fontFamily: T.sans,
              letterSpacing: "0.03em",
              boxShadow: `0 3px 12px rgba(192,75,44,0.25)`,
            }}
          >
            May 1–3
          </div>
        </div>

        {tab === "explore" && (
          <div style={{ paddingBottom: "14px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  background: T.parchment,
                  borderRadius: "14px",
                  padding: "10px 13px",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "14px", opacity: 0.5 }}>🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSrch(e.target.value)}
                  placeholder="Walks, neighbourhoods, leaders..."
                  style={{ border: "none", background: "none", outline: "none", fontSize: "13px", color: T.ink, width: "100%", fontFamily: T.sans, fontWeight: "500" }}
                />
                {search && (
                  <span onClick={() => setSrch("")} style={{ cursor: "pointer", color: T.sand, fontSize: "20px", lineHeight: 1 }}>
                    ×
                  </span>
                )}
              </div>
              <button
                onClick={() => showFilt(!filters)}
                style={{
                  background: nFilters > 0 ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})` : T.parchment,
                  color: nFilters > 0 ? T.white : T.inkMid,
                  border: "none",
                  borderRadius: "14px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "800",
                  fontFamily: T.sans,
                  boxShadow: nFilters > 0 ? `0 4px 14px rgba(192,75,44,0.28)` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {nFilters > 0 ? `Filter (${nFilters})` : "Filter"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {DAYS.map((d) => (
                <button
                  key={d.id || "all"}
                  onClick={() => setDay(d.id)}
                  style={{
                    background: day === d.id ? T.inkMid : T.parchment,
                    color: day === d.id ? T.white : T.inkMid,
                    border: "none",
                    borderRadius: "999px",
                    padding: "11px 16px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    fontFamily: T.sans,
                    transition: "all 0.15s ease",
                  }}
                >
                  {d.label}
                </button>
              ))}
              <button
                onClick={() => setShowEnded((v) => !v)}
                style={{
                  background: showEnded ? T.sandLight : "none",
                  color: showEnded ? T.inkMid : T.inkLight,
                  border: `1.5px solid ${T.sandLight}`,
                  borderRadius: "999px",
                  padding: "11px 16px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  fontFamily: T.sans,
                  transition: "all 0.15s ease",
                  }}
              >
                {showEnded ? "Hide ended" : "Show ended"}
              </button>
            </div>
          </div>
        )}

        {tab === "map" && (
          <div style={{ paddingBottom: "14px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
              {DAYS.map((d) => (
                <button
                  key={d.id || "all"}
                  onClick={() => setDay(d.id)}
                  style={{
                    background: day === d.id ? T.inkMid : T.parchment,
                    color: day === d.id ? T.white : T.inkMid,
                    border: "none",
                    borderRadius: "999px",
                    padding: "11px 16px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    fontFamily: T.sans,
                    transition: "all 0.15s ease",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {filters && tab === "explore" && (
          <div
            style={{
              paddingBottom: "16px",
              borderTop: `1.5px solid ${T.parchment}`,
              paddingTop: "14px",
              maxHeight: "52vh",
              overflowY: "auto",
              overscrollBehavior: "contain",
              paddingRight: "6px",
              marginRight: "-6px",
            }}
          >
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.09em", color: T.inkLight, fontFamily: T.sans, fontWeight: "700", marginBottom: "9px" }}>Time of Day</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTslot(tslot === s ? "" : s)}
                  style={{
                    background: tslot === s ? T.forest : T.parchment,
                    color: tslot === s ? T.white : T.inkMid,
                    border: "none",
                    borderRadius: "9px",
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    fontFamily: T.sans,
                    transition: "all 0.15s ease",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.09em", color: T.inkLight, fontFamily: T.sans, fontWeight: "700", marginBottom: "9px" }}>Themes</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {ALL_THEMES.map((t) => {
                const cfg = THEME_CFG[t] || { c: T.inkLight, bg: T.parchment };
                const on = themes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => togTheme(t)}
                    style={{
                      background: on ? cfg.c : T.parchment,
                      color: on ? T.white : T.inkMid,
                      border: "none",
                      borderRadius: "9px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      fontFamily: T.sans,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {nFilters > 0 && (
              <button
                onClick={() => { setThemes([]); setTslot(""); setDay(""); }}
                style={{
                  marginTop: "14px",
                  background: "none",
                  border: `1.5px solid ${T.rust}`,
                  borderRadius: "999px",
                  color: T.rust,
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "700",
                  padding: "10px 18px",
                  fontFamily: T.sans,
                }}
              >
                Clear all ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ paddingBottom: "90px" }}>
        {tab === "explore" && (
          <div style={{ padding: "16px 16px" }}>
            <div style={{ fontSize: "12px", color: T.inkLight, fontFamily: T.sans, marginBottom: "14px", fontWeight: "600" }}>
              {visibleWalks.length} walk{visibleWalks.length !== 1 ? "s" : ""}{" "}
              {nFilters || search || day ? "found" : "· May 1–3"}
              {!showEnded && endedCount > 0 && (
                <span style={{ color: T.sand, marginLeft: "6px" }}>· {endedCount} ended</span>
              )}
            </div>
            {visibleWalks.map((w, i) => (
              <WalkCard key={w.id} walk={w} starred={starred.has(w.id)} onToggle={toggleStar} onOpen={setDetail} idx={i} />
            ))}
            {visibleWalks.length === 0 && endedCount === 0 && (
              <div style={{ textAlign: "center", padding: "56px 20px", color: T.inkLight }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <Loop size={64} color={T.sand} op={0.45} />
                </div>
                <p style={{ fontFamily: T.serif, fontSize: "20px", color: T.inkMid, margin: "0 0 8px" }}>No walks match</p>
                <p style={{ fontFamily: T.sans, fontSize: "13px", margin: 0 }}>Try adjusting your filters.</p>
              </div>
            )}
          </div>
        )}
        {tab === "map" && <MapView walks={walksForMap} starred={starred} onOpen={setDetail} onToggle={toggleStar} />}
        {tab === "schedule" && <ScheduleView walks={WALKS} starred={starred} onOpen={setDetail} onToggle={toggleStar} />}
      </div>

      {/* Tab bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "430px",
          background: T.white,
          borderTop: `1.5px solid ${T.parchment}`,
          display: "flex",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom,0px)",
          boxShadow: `0 -4px 20px rgba(28,25,22,0.06)`,
        }}
      >
        {[
          { id: "explore", ico: "🗺", lbl: "Explore" },
          { id: "map", ico: "📍", lbl: "Map" },
          { id: "schedule", ico: "⭐", lbl: `Schedule${starred.size > 0 ? ` (${starred.size})` : ""}` },
        ].map(({ id, ico, lbl }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              onClick={() => { setTab(id); showFilt(false); }}
              onTouchEnd={(e) => { e.preventDefault(); setTab(id); showFilt(false); }}
              style={{
                flex: 1,
                border: "none",
                background: "none",
                padding: "14px 4px 12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                transition: "opacity 0.15s",
                touchAction: "manipulation",
              }}
            >
              <span style={{ fontSize: on ? "21px" : "19px", lineHeight: 1, transition: "font-size 0.15s ease" }}>{ico}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "0.05em",
                  fontFamily: T.sans,
                  textTransform: "uppercase",
                  color: on ? T.rust : T.sandLight,
                  transition: "color 0.15s",
                }}
              >
                {lbl}
              </span>
              {on && (
                <div
                  style={{
                    width: "22px",
                    height: "3px",
                    borderRadius: "2px",
                    background: `linear-gradient(90deg, ${T.rust}, ${T.rustLight})`,
                    marginTop: "1px",
                    animation: "tabPop 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <DetailSheet walk={detail} starred={detail ? starred.has(detail.id) : false} onToggle={toggleStar} onClose={() => setDetail(null)} />
    </div>
  );
}

export default function Page() {
  return <JanesWalkApp />;
}
