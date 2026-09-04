import type { Outfit, WardrobeItem } from "../domain/types";
import { seedItems, seedOutfits } from "./seed";

/**
 * Local database — web analogue of the Room database with a pre-population
 * callback on first launch. Persists to localStorage; images live in IndexedDB.
 */
const KEY_ITEMS = "atelier.v1.items";
const KEY_OUTFITS = "atelier.v1.outfits";
const KEY_META = "atelier.v1.meta";

export interface Meta {
  seededAt: number;
  name: string;
  build: string;
  skinTone: string;
  onboarded: boolean;
}

const defaultMeta = (): Meta => ({
  seededAt: Date.now(),
  name: "Atelier Client",
  build: "Athletic · Broad shoulders",
  skinTone: "Warm / Tan",
  onboarded: false,
});

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface DbSnapshot {
  items: WardrobeItem[];
  outfits: Outfit[];
  meta: Meta;
}

/** Opens the DB; seeds on first launch (RoomDatabase.Callback#onCreate analogue). */
export function openDatabase(): DbSnapshot {
  let items = read<WardrobeItem[]>(KEY_ITEMS);
  let outfits = read<Outfit[]>(KEY_OUTFITS);
  let meta = read<Meta>(KEY_META);

  if (!items || !outfits || !meta) {
    items = seedItems();
    outfits = seedOutfits();
    meta = defaultMeta();
    write(KEY_ITEMS, items);
    write(KEY_OUTFITS, outfits);
    write(KEY_META, meta);
  }
  return { items, outfits, meta };
}

export const saveItems = (items: WardrobeItem[]) => write(KEY_ITEMS, items);
export const saveOutfits = (outfits: Outfit[]) => write(KEY_OUTFITS, outfits);
export const saveMeta = (meta: Meta) => write(KEY_META, meta);

export function resetDatabase() {
  localStorage.removeItem(KEY_ITEMS);
  localStorage.removeItem(KEY_OUTFITS);
  localStorage.removeItem(KEY_META);
}

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
