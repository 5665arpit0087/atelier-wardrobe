import type { Occasion, Outfit, ResolvedOutfit, WardrobeItem, Weather } from "./types";

/* ───────────── colour helpers ───────────── */

export function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1: h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) * 60; break;
      case g1: h = ((b1 - r1) / d + 2) * 60; break;
      default: h = ((r1 - g1) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

export const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const isLight = (hex: string) => luminance(hex) > 0.35;

/* ───────────── harmony scoring ───────────── */

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Pairwise colour harmony 0..1 tuned for earth + jewel-tone capsule wardrobes. */
export function harmony(a: WardrobeItem, b: WardrobeItem) {
  const A = hexToHsl(a.hex), B = hexToHsl(b.hex);
  const neutralA = A.s < 0.18 || A.l < 0.12 || A.l > 0.85;
  const neutralB = B.s < 0.18 || B.l < 0.12 || B.l > 0.85;
  if (neutralA || neutralB) {
    // Neutrals go with everything; reward luminance contrast.
    const contrast = Math.abs(A.l - B.l);
    return 0.72 + Math.min(0.28, contrast * 0.5);
  }
  const d = hueDistance(A.h, B.h);
  let score = 0.5;
  if (d < 25) score = 0.78; // tonal / monochrome
  else if (d < 60) score = 0.88; // analogous (olive + rust, camel + green)
  else if (d > 150) score = 0.9; // complementary (rust + green, maroon + teal)
  else if (d > 100) score = 0.7; // split-complementary
  else score = 0.55; // awkward mid-range
  const contrast = Math.abs(A.l - B.l);
  score += Math.min(0.12, contrast * 0.3);
  if (a.tone === "warm" && b.tone === "warm") score += 0.04; // warm skin harmony
  return Math.min(1, score);
}

export interface ScoredOutfit {
  top: WardrobeItem;
  layer?: WardrobeItem;
  bottom: WardrobeItem;
  shoe: WardrobeItem;
  score: number;
  breakdown: { harmony: number; weather: number; occasion: number; skin: number };
}

const tonesForSkin: Record<string, number> = { warm: 1, neutral: 0.9, cool: 0.78 };

export function scoreCombo(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoe: WardrobeItem,
  occ: Occasion,
  weather: Weather,
  layer?: WardrobeItem,
): ScoredOutfit {
  const pieces = [top, bottom, shoe, ...(layer ? [layer] : [])];
  const pairs: number[] = [];
  for (let i = 0; i < pieces.length; i++)
    for (let j = i + 1; j < pieces.length; j++) pairs.push(harmony(pieces[i], pieces[j]));
  const harmonyScore = pairs.reduce((a, b) => a + b, 0) / pairs.length;

  const weatherScore = pieces.reduce((a, p) => a + p.weather[weather], 0) / pieces.length;
  const occasionScore = pieces.reduce((a, p) => a + (p.occasions.includes(occ) ? 1 : 0.35), 0) / pieces.length;
  const skinScore = pieces.reduce((a, p) => a + tonesForSkin[p.tone], 0) / pieces.length;

  const score = harmonyScore * 0.4 + weatherScore * 0.25 + occasionScore * 0.25 + skinScore * 0.1;
  return {
    top, bottom, shoe, layer, score,
    breakdown: { harmony: harmonyScore, weather: weatherScore, occasion: occasionScore, skin: skinScore },
  };
}

export function generateLooks(
  items: WardrobeItem[],
  occ: Occasion,
  weather: Weather,
  opts: { limit?: number; exclude?: Set<string>; seed?: number } = {},
): ScoredOutfit[] {
  const tops = items.filter((i) => i.category === "TOP");
  const bottoms = items.filter((i) => i.category === "BOTTOM");
  const shoes = items.filter((i) => i.category === "SHOES");
  const layers = items.filter((i) => i.category === "LAYER");

  const out: ScoredOutfit[] = [];
  for (const t of tops)
    for (const b of bottoms)
      for (const s of shoes) {
        out.push(scoreCombo(t, b, s, occ, weather));
        if (weather === "COOL")
          for (const l of layers) if (l.id !== t.id) out.push(scoreCombo(t, b, s, occ, weather, l));
      }

  // In cool weather, prefer layered combos; in hot weather layers are dropped entirely.
  const filtered = out.filter((o) => !opts.exclude?.has(comboKey(o)));
  filtered.sort((a, b) => b.score - a.score);

  // Diversify: avoid repeating the same top in the shortlist.
  const seenTops = new Set<string>();
  const diverse: ScoredOutfit[] = [];
  for (const o of filtered) {
    if (seenTops.has(o.top.id)) continue;
    seenTops.add(o.top.id);
    diverse.push(o);
    if (diverse.length >= (opts.limit ?? 6)) break;
  }
  return diverse;
}

export const comboKey = (o: { top: WardrobeItem; bottom: WardrobeItem; shoe: WardrobeItem; layer?: WardrobeItem }) =>
  [o.top.id, o.layer?.id ?? "-", o.bottom.id, o.shoe.id].join("|");

/* ───────────── style copy ───────────── */

const occCopy: Record<Occasion, string[]> = {
  DATE: [
    "Keep the fit close through the chest — the silhouette does the talking.",
    "Unbutton the top two buttons; a hint of collarbone reads confident, not loud.",
    "Roll sleeves twice to the forearm — it sharpens the V-taper.",
  ],
  SMART_CASUAL: [
    "Tuck loosely at the front only — clean waist, relaxed shoulders.",
    "Keep hems cropped just above the shoe for a lean, intentional line.",
    "One texture contrast (knit vs. twill) keeps it refined rather than flat.",
  ],
  DAILY_CASUAL: [
    "Let the top skim rather than cling — effortless is the goal.",
    "Push sleeves up once; it keeps the look easy and shows forearm definition.",
    "Pair with a minimal watch — nothing else needed.",
  ],
  ATHLEISURE: [
    "Cinch the jogger cuff above the ankle to show the shoe profile.",
    "Layer open, not zipped — it frames the chest and traps.",
    "Keep everything tonal; performance wear looks elite when it's quiet.",
  ],
};

export function craftTip(o: ScoredOutfit, occ: Occasion, weather: Weather) {
  const t = hexToHsl(o.top.hex), b = hexToHsl(o.bottom.hex);
  const d = Math.abs(t.h - b.h) % 360;
  const hd = d > 180 ? 360 - d : d;
  const neutralBottom = b.s < 0.18 || b.l < 0.12;
  let color: string;
  if (neutralBottom && b.l < 0.2)
    color = `${o.top.color} against clean black sharpens shoulder width — high contrast, high impact.`;
  else if (neutralBottom)
    color = `${o.top.color} sits calmly on ${o.bottom.color.toLowerCase()} — grounded and modern.`;
  else if (hd > 150)
    color = `${o.top.color} and ${o.bottom.color.toLowerCase()} are near-complements — rich, autumnal depth.`;
  else if (hd < 60)
    color = `${o.top.color} and ${o.bottom.color.toLowerCase()} sit in one warm family — tonal and expensive-looking.`;
  else color = `${o.top.color} balanced by ${o.bottom.color.toLowerCase()} — a quiet jewel-tone statement.`;

  const skin =
    o.top.tone === "warm"
      ? " Warm pigment lifts a tan complexion."
      : o.top.tone === "cool"
        ? " The cool jewel tone makes warm skin glow by contrast."
        : "";
  const layer = o.layer ? ` Wear the ${o.layer.subcategory.toLowerCase()} open to broaden the traps.` : "";
  const w = weather === "HOT" ? " Breathable and light for the heat." : weather === "COOL" ? " Built for the chill without bulk." : "";
  const tips = occCopy[occ];
  const idx = (o.top.id.length + o.bottom.id.length) % tips.length;
  return `${color}${skin}${layer}${w} ${tips[idx]}`;
}

/* ───────────── resolution ───────────── */

export function resolveOutfit(o: Outfit, items: WardrobeItem[]): ResolvedOutfit | null {
  const by = (id?: string) => items.find((i) => i.id === id);
  const top = by(o.topId), bottom = by(o.bottomId), shoe = by(o.shoeId);
  if (!top || !bottom || !shoe) return null;
  return { ...o, top, bottom, shoe, layer: by(o.layerId) };
}

export function paletteOf(o: { top: WardrobeItem; bottom: WardrobeItem; shoe: WardrobeItem; layer?: WardrobeItem }) {
  return [o.layer?.hex, o.top.hex, o.bottom.hex, o.shoe.hex].filter(Boolean) as string[];
}
