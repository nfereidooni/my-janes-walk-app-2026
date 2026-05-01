const fs = require("fs");
const path = require("path");

const WALKS_PATH = path.join(process.cwd(), "app", "data", "walks.json");
const CACHE_PATH = path.join(process.cwd(), "app", "data", "geocode-cache.json");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function normalizeQuery(q) {
  let s = String(q || "");
  s = s.replace(/https?:\/\/\S+/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  // Strip common boilerplate that hurts geocoding.
  s = s.replace(/^Meeting Point:\s*/i, "");
  s = s.replace(/^Meet(ing)?\s*at\s*/i, "");
  s = s.replace(/\bTransit:\b.*$/i, "");
  s = s.replace(/\bStop#?\d+.*$/i, "");
  s = s.replace(/\bLook for\b.*$/i, "");
  s = s.replace(/\bLeaders?\b.*$/i, "");

  // Prefer the most “address-like” first segments.
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) s = `${parts[0]}, ${parts[1]}`;
  else if (parts.length === 1) s = parts[0];

  // Remove the word "neighbourhood" when it's just descriptive.
  s = s.replace(/\bneighbourhood\b/gi, "").replace(/\s+/g, " ").trim();

  // Keep queries short; Nominatim performs better.
  if (s.length > 120) s = s.slice(0, 120).trim();
  return s;
}

function queryCandidatesFromStart(startRaw) {
  const s = String(startRaw || "");
  const out = [];

  // Prefer explicit street addresses first.
  const addr = s.match(/\b(\d{1,5}\s+[A-Za-z0-9'.-]+(?:\s+[A-Za-z0-9'.-]+){0,6}\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Crescent|Cres|Place|Pl|Parkway|Pkwy|Way))\b/i);
  if (addr) out.push(addr[1]);

  // Prefer parenthesized "123 X St" fragments.
  const paren = s.match(/\(([^)]{6,80})\)/);
  if (paren) out.push(paren[1]);

  // Intersections like "X & Y"
  const inter = s.match(/\b([A-Za-z][^,]{2,40})\s*(?:&|and)\s*([A-Za-z][^,]{2,40})\b/i);
  if (inter) out.push(`${inter[1]} & ${inter[2]}`);

  // TTC station hints.
  const stn = s.match(/\b([A-Za-z][A-Za-z'\s-]{2,40})\s+(?:subway\s+)?station\b/i);
  if (stn) out.push(`${stn[1]} Station`);

  // First 1-2 comma segments after cleanup.
  const cleaned = normalizeQuery(s);
  if (cleaned) out.push(cleaned);
  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 1) out.push(parts[0]);
  if (parts.length >= 2) out.push(`${parts[0]}, ${parts[1]}`);

  // De-dup, keep short.
  const uniq = [];
  for (const q of out) {
    const k = String(q).trim();
    if (!k) continue;
    if (!uniq.includes(k)) uniq.push(k);
  }
  return uniq.slice(0, 6);
}

async function geocodeNominatim(query) {
  // Nominatim usage policy requires a real user agent.
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "ca");
  // Rough Toronto bounding box to keep results in/near the city.
  url.searchParams.set("viewbox", "-79.6393,43.8555,-79.1169,43.5810");
  url.searchParams.set("bounded", "1");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "janes-walk-next-app (local dev) - geocoding script",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) throw new Error(`Geocode failed ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const hit = data[0];
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    displayName: hit.display_name,
  };
}

async function main() {
  const walks = loadJson(WALKS_PATH, []);
  const cache = loadJson(CACHE_PATH, {});

  let updated = 0;
  let attempted = 0;
  let skipped = 0;

  for (let i = 0; i < walks.length; i++) {
    const w = walks[i];
    if (Number.isFinite(w.lat) && Number.isFinite(w.lng)) {
      skipped++;
      continue;
    }

    const candidates = queryCandidatesFromStart(w.start || w.neighbourhood || "");
    if (candidates.length === 0) continue;

    attempted++;
    process.stdout.write(`Geocoding ${i + 1}/${walks.length}: ${w.title} ... `);

    let found = false;
    for (const cand of candidates) {
      const q = cand.toLowerCase().includes("toronto") ? cand : `${cand}, Toronto`;
      if (Object.prototype.hasOwnProperty.call(cache, q)) {
        const hit = cache[q];
        if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
          w.lat = hit.lat;
          w.lng = hit.lng;
          updated++;
          found = true;
        }
        if (found) break;
        continue;
      }

      try {
        const hit = await geocodeNominatim(q);
        cache[q] = hit;
        if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
          w.lat = hit.lat;
          w.lng = hit.lng;
          updated++;
          found = true;
          break;
        }
      } catch (e) {
        cache[q] = null;
      }

      await sleep(1100);
    }

    process.stdout.write(found ? "ok\n" : "no result\n");

    if (attempted % 10 === 0) {
      saveJson(CACHE_PATH, cache);
      saveJson(WALKS_PATH, walks);
    }
  }

  saveJson(CACHE_PATH, cache);
  saveJson(WALKS_PATH, walks);

  console.log({ total: walks.length, updated, attempted, skipped });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

