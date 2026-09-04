import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Category, Occasion, Outfit, ResolvedOutfit, WardrobeItem, Weather } from "../domain/types";
import { openDatabase, resetDatabase, saveItems, saveMeta, saveOutfits, uid, type Meta } from "../data/repository";
import { deleteImage, getAllImages, putImage } from "../data/imageStore";
import { compressImage, type CompressedImage } from "../utils/image";
import { resolveOutfit } from "../domain/stylist";

export type Screen = "home" | "wardrobe" | "stylist" | "looks" | "profile";

const SCREENS: Screen[] = ["home", "wardrobe", "stylist", "looks", "profile"];

function screenFromHash(): Screen {
  try {
    const h = window.location.hash.replace(/^#\/?/, "").split("?")[0] as Screen;
    return SCREENS.includes(h) ? h : "home";
  } catch {
    return "home";
  }
}

export interface NewItemInput {
  name: string;
  brand: string;
  category: Category;
  subcategory: string;
  color: string;
  hex: string;
  hex2?: string;
  tone: WardrobeItem["tone"];
  occasions: Occasion[];
  weather: Record<Weather, number>;
  file?: File;
}

export interface NewOutfitInput {
  title: string;
  occ: Occasion;
  weather: Weather;
  topId: string;
  layerId?: string;
  bottomId: string;
  shoeId: string;
  styleTip: string;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Store {
  ready: boolean;
  items: WardrobeItem[];
  outfits: Outfit[];
  resolved: ResolvedOutfit[];
  meta: Meta;
  imageUrls: Record<string, string>;
  toast: string | null;
  toastAction: ToastAction | null;
  notify: (msg: string, action?: ToastAction) => void;

  screen: Screen;
  setScreen: (s: Screen) => void;
  selectedItemId: string | null;
  openItem: (id: string | null) => void;
  selectedOutfitId: string | null;
  openOutfit: (id: string | null) => void;
  addSheetOpen: boolean;
  setAddSheetOpen: (v: boolean) => void;
  weatherNow: Weather;
  setWeatherNow: (w: Weather) => void;

  toggleItemFavorite: (id: string) => void;
  toggleOutfitFavorite: (id: string) => void;
  logWear: (outfitId: string) => void;
  addItem: (input: NewItemInput) => Promise<CompressedImage | null>;
  updateItem: (id: string, patch: Partial<WardrobeItem>) => void;
  deleteItem: (id: string) => void;
  attachImage: (itemId: string, file: File) => Promise<CompressedImage>;
  removeImage: (itemId: string) => Promise<void>;
  addOutfit: (input: NewOutfitInput) => Outfit;
  deleteOutfit: (id: string) => void;
  undoLastDelete: () => void;
  updateMeta: (patch: Partial<Meta>) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function AtelierProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [meta, setMeta] = useState<Meta>({ seededAt: 0, name: "", build: "", skinTone: "", onboarded: false });
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ToastAction | null>(null);
  const toastTimer = useRef<number | null>(null);
  const lastDeleted = useRef<{ item?: WardrobeItem; itemOutfits?: Outfit[]; outfit?: Outfit } | null>(null);

  const [screen, setScreenState] = useState<Screen>(() => screenFromHash());
  const [selectedItemId, openItem] = useState<string | null>(null);
  const [selectedOutfitId, openOutfit] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [weatherNow, setWeatherNowState] = useState<Weather>(() => {
    const saved = localStorage.getItem("atelier.v1.weather") as Weather | null;
    if (saved) return saved;
    const m = new Date().getMonth();
    return m >= 4 && m <= 8 ? "HOT" : m >= 10 || m <= 1 ? "COOL" : "PLEASANT";
  });
  const setWeatherNow = useCallback((w: Weather) => {
    setWeatherNowState(w);
    localStorage.setItem("atelier.v1.weather", w);
  }, []);

  // Hash routing: deep-linkable screens, survives reload + back/forward.
  const setScreen = useCallback((s: Screen) => {
    setScreenState(s);
    try {
      const next = `#/${s}`;
      if (window.location.hash !== next) window.history.pushState(null, "", next);
    } catch {
      /* non-browser / restricted context */
    }
  }, []);

  useEffect(() => {
    const onHash = () => setScreenState(screenFromHash());
    window.addEventListener("hashchange", onHash);
    // Ensure a hash exists on first load for shareable URLs.
    try {
      if (!window.location.hash) window.history.replaceState(null, "", `#/${screenFromHash()}`);
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Open database on launch (seeds on first run) and hydrate image URLs.
  useEffect(() => {
    const snap = openDatabase();
    setItems(snap.items);
    setOutfits(snap.outfits);
    setMeta(snap.meta);
    getAllImages()
      .then((blobs) => {
        const urls: Record<string, string> = {};
        for (const [k, v] of Object.entries(blobs)) urls[k] = URL.createObjectURL(v);
        setImageUrls(urls);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Persist on change.
  useEffect(() => { if (ready) saveItems(items); }, [items, ready]);
  useEffect(() => { if (ready) saveOutfits(outfits); }, [outfits, ready]);
  useEffect(() => { if (ready) saveMeta(meta); }, [meta, ready]);

  const notify = useCallback((msg: string, action?: ToastAction) => {
    setToast(msg);
    setToastAction(action ?? null);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      setToastAction(null);
    }, action ? 5000 : 2400);
  }, []);

  const resolved = useMemo(
    () => outfits.map((o) => resolveOutfit(o, items)).filter((o): o is ResolvedOutfit => !!o),
    [outfits, items],
  );

  const toggleItemFavorite = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)));
  }, []);

  const toggleOutfitFavorite = useCallback((id: string) => {
    setOutfits((prev) => prev.map((o) => (o.id === id ? { ...o, favorite: !o.favorite } : o)));
  }, []);

  const logWear = useCallback((outfitId: string) => {
    const now = Date.now();
    const o = outfits.find((x) => x.id === outfitId);
    if (!o) return;
    const ids = new Set([o.topId, o.layerId, o.bottomId, o.shoeId].filter(Boolean));
    setItems((its) => its.map((i) => (ids.has(i.id) ? { ...i, wearCount: i.wearCount + 1, lastWorn: now } : i)));
    setOutfits((prev) => prev.map((x) => (x.id === outfitId ? { ...x, wearCount: x.wearCount + 1, lastWorn: now } : x)));
    notify("Logged to your wear history");
  }, [outfits, notify]);

  const attachImage = useCallback(async (itemId: string, file: File) => {
    const result = await compressImage(file);
    const imageId = `img_${itemId}_${Date.now().toString(36)}`;
    await putImage(imageId, result.blob);
    const url = URL.createObjectURL(result.blob);
    setImageUrls((prev) => ({ ...prev, [imageId]: url }));
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        if (i.imageId) deleteImage(i.imageId).catch(() => {});
        return { ...i, imageId };
      }),
    );
    return result;
  }, []);

  const removeImage = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item?.imageId) {
      await deleteImage(item.imageId).catch(() => {});
      setImageUrls((prev) => { const n = { ...prev }; delete n[item.imageId!]; return n; });
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, imageId: undefined } : i)));
    }
  }, [items]);

  const addItem = useCallback(async (input: NewItemInput) => {
    const id = uid("item");
    const item: WardrobeItem = {
      id,
      name: input.name,
      brand: input.brand,
      category: input.category,
      subcategory: input.subcategory,
      color: input.color,
      hex: input.hex,
      hex2: input.hex2,
      tone: input.tone,
      occasions: input.occasions,
      weather: input.weather,
      favorite: false,
      wearCount: 0,
      createdAt: Date.now(),
      custom: true,
    };
    setItems((prev) => [item, ...prev]);
    let compressed: CompressedImage | null = null;
    if (input.file) compressed = await attachImage(id, input.file);
    notify(`${input.name} added to wardrobe`);
    return compressed;
  }, [attachImage, notify]);

  const updateItem = useCallback((id: string, patch: Partial<WardrobeItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const affected = outfits.filter((o) => [o.topId, o.layerId, o.bottomId, o.shoeId].includes(id));
    lastDeleted.current = { item, itemOutfits: affected };
    if (item?.imageId) deleteImage(item.imageId).catch(() => {});
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOutfits((prev) => prev.filter((o) => ![o.topId, o.layerId, o.bottomId, o.shoeId].includes(id)));
    openItem(null);
    notify("Removed from wardrobe", {
      label: "Undo",
      onClick: () => {
        const snap = lastDeleted.current;
        if (snap?.item) {
          setItems((prev) => (prev.some((i) => i.id === snap.item!.id) ? prev : [snap.item!, ...prev]));
          if (snap.itemOutfits?.length) {
            setOutfits((prev) => {
              const ids = new Set(prev.map((o) => o.id));
              return [...snap.itemOutfits!.filter((o) => !ids.has(o.id)), ...prev];
            });
          }
          lastDeleted.current = null;
        }
        setToast(null);
        setToastAction(null);
      },
    });
  }, [items, outfits, notify]);

  const addOutfit = useCallback((input: NewOutfitInput) => {
    const outfit: Outfit = { id: uid("look"), ...input, favorite: true, wearCount: 0, createdAt: Date.now(), custom: true };
    setOutfits((prev) => [outfit, ...prev]);
    notify(`"${input.title}" saved to your looks`);
    return outfit;
  }, [notify]);

  const deleteOutfit = useCallback((id: string) => {
    const outfit = outfits.find((o) => o.id === id);
    if (!outfit) return;
    lastDeleted.current = { outfit };
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    openOutfit(null);
    notify("Look removed", {
      label: "Undo",
      onClick: () => {
        const snap = lastDeleted.current;
        if (snap?.outfit) {
          setOutfits((prev) => (prev.some((o) => o.id === snap.outfit!.id) ? prev : [snap.outfit!, ...prev]));
          lastDeleted.current = null;
        }
        setToast(null);
        setToastAction(null);
      },
    });
  }, [notify, outfits]);

  const updateMeta = useCallback((patch: Partial<Meta>) => setMeta((m) => ({ ...m, ...patch })), []);

  const undoLastDelete = useCallback(() => {
    toastAction?.onClick();
  }, [toastAction]);

  const reset = useCallback(() => {
    resetDatabase();
    const snap = openDatabase();
    setItems(snap.items);
    setOutfits(snap.outfits);
    setMeta({ ...snap.meta, onboarded: true });
    notify("Wardrobe restored to the original capsule");
  }, [notify]);

  const value: Store = {
    ready, items, outfits, resolved, meta, imageUrls, toast, toastAction, notify,
    screen, setScreen, selectedItemId, openItem, selectedOutfitId, openOutfit, addSheetOpen, setAddSheetOpen,
    weatherNow, setWeatherNow,
    toggleItemFavorite, toggleOutfitFavorite, logWear, addItem, updateItem, deleteItem, attachImage, removeImage,
    addOutfit, deleteOutfit, undoLastDelete, updateMeta, reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAtelier() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAtelier must be used inside AtelierProvider");
  return ctx;
}
