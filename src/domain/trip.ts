import { scoreCombo } from "./stylist";
import type { Occasion, ResolvedOutfit, WardrobeItem, Weather } from "./types";

/* ───────────── trip inputs ───────────── */

export type TripVibe = "CHILL" | "SMART" | "NIGHTS" | "ACTIVE" | "MIXED";
export type TripDays = 2 | 3 | 4 | 5 | "6+";

export const TRIP_DAY_OPTIONS: { value: TripDays; label: string; days: number }[] = [
  { value: 2, label: "2 days", days: 2 },
  { value: 3, label: "3 days", days: 3 },
  { value: 4, label: "4 days", days: 4 },
  { value: 5, label: "5 days", days: 5 },
  { value: "6+", label: "6+ days", days: 6 },
];

export const TRIP_VIBES: { key: TripVibe; label: string; blurb: string }[] = [
  { key: "CHILL", label: "Chill", blurb: "Easy daytime casual" },
  { key: "SMART", label: "Smart", blurb: "Polished casual" },
  { key: "NIGHTS", label: "Nights out", blurb: "Evening statements" },
  { key: "ACTIVE", label: "Active", blurb: "Gym & movement" },
  { key: "MIXED", label: "Mixed", blurb: "Days + evenings out" },
];

/** Occasion rotation per vibe. Single-vibe trips repeat one occasion;
 *  MIXED cycles days → smart → days → evening across the trip. */
const VIBE_PATTERN: Record<TripVibe, Occasion[]> = {
  CHILL: ["DAILY_CASUAL"],
  SMART: ["SMART_CASUAL"],
  NIGHTS: ["DATE"],
  ACTIVE: ["ATHLEISURE"],
  MIXED: ["DAILY_CASUAL", "SMART_CASUAL", "DAILY_CASUAL", "DATE", "SMART_CASUAL", "DAILY_CASUAL", "DATE"],
};

export function vibeOccasion(vibe: TripVibe, dayIndex: number): Occasion {
  const p = VIBE_PATTERN[vibe];
  return p[dayIndex % p.length];
}

/* ───────────── trip plan ───────────── */

export interface TripDayPlan {
  day: number;
  look: ResolvedOutfit;
  score: number;
  /** piece ids already worn on an earlier day (the re-wear wins) */
  rewornIds: string[];
}

export interface TripPlan {
  dayCount: number;
  sixPlus: boolean;
  weather: Weather;
  vibe: TripVibe;
  days: TripDayPlan[];
  travelLook: ResolvedOutfit;
  wornIds: string[];
  packTops: WardrobeItem[];
  packBottoms: WardrobeItem[];
  packShoes: WardrobeItem[];
  packLayers: WardrobeItem[];
  totalPacked: number;
}

/**
 * Build an optimized capsule from the user's verified looks.
 *
 * Reusability rules (anti-overpacking):
 * - bottoms are re-worn: at most ceil(days / 2) distinct pairs, never two days running
 * - shoes are capped at 1 pair (≤2 days) or 2 pairs (3+ days)
 * - tops stay fresh each day while the wardrobe allows, then least-recent repeats
 * - day 1 prefers a layered look so the bulkiest pieces are worn, not packed
 */
export function planTrip(
  looks: ResolvedOutfit[],
  dayCount: number,
  weather: Weather,
  vibe: TripVibe,
): TripPlan | null {
  if (!looks.length || dayCount < 1) return null;

  const bottomTarget = dayCount <= 2 ? 2 : Math.max(1, Math.ceil(dayCount / 2));
  const shoeTarget = dayCount <= 2 ? 1 : 2;

  const usedTops = new Set<string>();
  const bottomLastDay = new Map<string, number>();
  const lookLastDay = new Map<string, number>();
  const packedShoes = new Set<string>();
  const days: TripDayPlan[] = [];

  // Same-occasion pool across ALL weathers: weather fit is a score bonus,
  // not a hard filter, so small pools (e.g. evenings in cool weather)
  // still rotate instead of repeating one look every day.
  const poolFor = (occ: Occasion): ResolvedOutfit[] => {
    const same = looks.filter((l) => l.occ === occ);
    return same.length ? same : looks; // vibe occasion fully deleted → fall back to everything
  };

  for (let i = 0; i < dayCount; i++) {
    const occ = vibeOccasion(vibe, i);
    const scored = poolFor(occ).map((l) => {
      const last = lookLastDay.get(l.id);
      const recency = last === undefined ? 0 : last === i - 1 ? -0.15 : -0.06;
      // Scored against the TRIP's climate, not the look's home tag —
      // a hot-weather polo must lose to a cool layer on a cool trip.
      const fit = scoreCombo(l.top, l.bottom, l.shoe, l.occ, weather, l.layer).score;
      return {
        l,
        base: fit + (l.weather === weather ? 0.03 : 0) + (i === 0 && l.layer ? 0.05 : 0) + recency,
      };
    });
    if (!scored.length) return null;

    const bottomOk = (id: string) => bottomLastDay.has(id) || bottomLastDay.size < bottomTarget;
    const freshBottom = (id: string) => bottomLastDay.get(id) !== i - 1;
    const shoeOk = (id: string) => packedShoes.has(id) || packedShoes.size < shoeTarget;
    // Strict → loose passes so constraints hold whenever the wardrobe allows it.
    // Bottom rotation outranks top freshness: repeating a top with a gap
    // looks intentional, repeating a bottom two days running never does.
    const passes: ((c: (typeof scored)[number]) => boolean)[] = [
      (c) => !usedTops.has(c.l.top.id) && bottomOk(c.l.bottom.id) && freshBottom(c.l.bottom.id) && shoeOk(c.l.shoe.id),
      (c) => bottomOk(c.l.bottom.id) && freshBottom(c.l.bottom.id) && shoeOk(c.l.shoe.id),
      (c) => !usedTops.has(c.l.top.id) && bottomOk(c.l.bottom.id) && shoeOk(c.l.shoe.id),
      (c) => bottomOk(c.l.bottom.id) && shoeOk(c.l.shoe.id),
      (c) => shoeOk(c.l.shoe.id),
      () => true,
    ];
    let pick: (typeof scored)[number] | null = null;
    for (const pass of passes) {
      const candidates = scored.filter(pass).sort((a, b) => b.base - a.base);
      if (candidates.length) {
        pick = candidates[0];
        break;
      }
    }
    if (!pick) return null;

    usedTops.add(pick.l.top.id);
    bottomLastDay.set(pick.l.bottom.id, i);
    lookLastDay.set(pick.l.id, i);
    packedShoes.add(pick.l.shoe.id);
    days.push({ day: i + 1, look: pick.l, score: pick.base, rewornIds: [] });
  }

  // Flag re-worn pieces per day (the packing win to show off).
  const seen = new Set<string>();
  for (const d of days) {
    const ids = [d.look.top.id, d.look.layer?.id, d.look.bottom.id, d.look.shoe.id].filter(Boolean) as string[];
    d.rewornIds = ids.filter((id) => seen.has(id));
    ids.forEach((id) => seen.add(id));
  }

  const travelLook = days[0].look;
  const worn = new Set(
    [travelLook.top.id, travelLook.layer?.id, travelLook.bottom.id, travelLook.shoe.id].filter(Boolean) as string[],
  );
  const uniq = (arr: WardrobeItem[]) => [...new Map(arr.map((p) => [p.id, p])).values()];
  const fresh = (p: WardrobeItem) => !worn.has(p.id);
  const packTops = uniq(days.map((d) => d.look.top)).filter(fresh);
  const packBottoms = uniq(days.map((d) => d.look.bottom)).filter(fresh);
  const packShoes = uniq(days.map((d) => d.look.shoe)).filter(fresh);
  const packLayers = uniq(days.map((d) => d.look.layer).filter(Boolean) as WardrobeItem[]).filter(fresh);

  return {
    dayCount,
    sixPlus: dayCount >= 6,
    weather,
    vibe,
    days,
    travelLook,
    wornIds: [...worn],
    packTops,
    packBottoms,
    packShoes,
    packLayers,
    totalPacked: packTops.length + packBottoms.length + packShoes.length + packLayers.length,
  };
}
