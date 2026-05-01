const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

function parseDurationToMinutes(value) {
  if (!value) return null;
  // Expecting "H:MM:SS" (e.g. "1:30:00")
  const m = String(value).trim().match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] ? Number(m[3]) : 0;
  return h * 60 + mm + Math.round(ss / 60);
}

function parseTimeToken(token) {
  if (!token) return null;
  let s = String(token).trim();
  if (!s) return null;

  // Handle ranges like "11:00am-12:30pm" or "11:00am – 12:30pm"
  s = s.split(/[–-]/)[0].trim();

  // Normalize spacing/case (allow "11:00am")
  const m12 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
  if (m12) {
    let h = Number(m12[1]);
    const mm = Number(m12[2]);
    const ampm = m12[4].toUpperCase();
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    const minutes = h * 60 + mm;
    const displayH = ((Number(m12[1]) % 12) || 12);
    return { minutes, display: `${displayH}:${m12[2]} ${ampm}` };
  }

  // Handle 24h "HH:MM(:SS)" (rare, but shows up sometimes)
  const m24 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/);
  if (m24) {
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    if (hh >= 0 && hh <= 23) {
      const minutes = hh * 60 + mm;
      const ampm = hh >= 12 ? "PM" : "AM";
      const displayH = ((hh % 12) || 12);
      return { minutes, display: `${displayH}:${m24[2]} ${ampm}` };
    }
  }

  return null;
}

function splitStartTimes(value) {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  // Split on &, commas, semicolons, slashes, newlines, and the word "and"
  return raw
    .split(/\s*(?:&|,|;|\/|\n|\band\b)\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toTitleCase(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function normalizeThemes(value) {
  const raw = splitList(value);
  // Normalize inconsistent casing from spreadsheet.
  // Keep meaningful punctuation (&, /) by title-casing word tokens.
  return raw.map((t) =>
    String(t)
      .trim()
      .replace(/\s+/g, " ")
      .split(/(\s+|\/|&|-)/g)
      .map((part) => (/^\s+$|^\/$|^&$|^-$/.test(part) ? part : toTitleCase(part)))
      .join("")
      .trim(),
  );
}

function normalizeTags(value) {
  return splitList(value);
}

function inferNeighbourhood(startLocation) {
  // Best-effort: many entries contain "X neighbourhood" or similar.
  if (!startLocation) return "";
  const s = String(startLocation);
  const m = s.match(/^\s*([^.\n]+?)\s+neighbourhood\b/i);
  if (m) return m[1].trim();
  return "";
}

function main() {
  const workbookPath = path.join(process.cwd(), "Jane's Walk 2026 List.xlsx");
  const outPath = path.join(process.cwd(), "app", "data", "walks.json");

  const wb = xlsx.readFile(workbookPath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "", raw: false });

  const walks = rows
    .map((r, idx) => {
      const url = r["Walk Webpage Link"] || "";
      const title = r["Title of Your Walk"] || "";
      const summary = r["Walk Summary"] || "";
      const themes = normalizeThemes(r["What are the theme(s) of your walk?"]);
      const leaders = r["Name of the walk leader(s)"] || "";
      const org = r["Organization name (if applicable)"] || "";
      const duration = parseDurationToMinutes(r["Walk duration"]);
      const date = r["Walk date"] || "";
      const start = r["Walk start location"] || "";
      const end = r["Walk end location"] || "";
      const tags = normalizeTags(r["Accessibility considerations"]);
      const neighbourhood = inferNeighbourhood(start);

      if (!title && !url) return null;

      const timeRaw = r["Start time"] || "";
      const tokens = splitStartTimes(timeRaw);
      const parsed = tokens.length ? tokens.map(parseTimeToken).filter(Boolean) : [];

      // If we can't parse, keep one event with the raw time string.
      const times = parsed.length
        ? parsed
        : [{ minutes: 0, display: String(timeRaw).trim() || "TBA" }];

      // Heuristic cleanup: a few entries appear to have AM/PM typos (e.g. "1:00 AM" for daytime walks).
      const cleanedTimes = times.map((t) => {
        if (t.display === "1:00 AM" && String(date).includes("May")) {
          return { minutes: 13 * 60, display: "1:00 PM" };
        }
        return t;
      });

      return cleanedTimes.map((t, j) => ({
        id: (idx + 1) * 100 + (j + 1),
        title,
        summary,
        themes,
        leaders,
        org,
        duration: duration ?? 0,
        date,
        time: t.display,
        timeSort: Number.isFinite(t.minutes) ? t.minutes : 0,
        start,
        end,
        tags,
        neighbourhood,
        url,
      }));
    })
    .filter(Boolean)
    .flat();

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(walks, null, 2) + "\n");

  console.log(`Wrote ${walks.length} walks -> ${path.relative(process.cwd(), outPath)}`);
}

main();

