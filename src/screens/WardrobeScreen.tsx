import { AnimatePresence, motion } from "framer-motion";
import { Camera, Heart, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemVisual } from "../components/ItemVisual";
import { Chip } from "../components/ui";
import { CATEGORIES, type Category, type WardrobeItem } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { cn } from "../utils/cn";

type Sort = "recent" | "name" | "worn" | "color";

export function WardrobeScreen() {
  const { items, openItem, toggleItemFavorite, setAddSheetOpen } = useAtelier();
  const [cat, setCat] = useState<Category | "ALL" | "FAV">("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [showSort, setShowSort] = useState(false);

  const list = useMemo(() => {
    let l = items;
    if (cat === "FAV") l = l.filter((i) => i.favorite);
    else if (cat !== "ALL") l = l.filter((i) => i.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((i) => [i.name, i.brand, i.color, i.subcategory].some((f) => f.toLowerCase().includes(s)));
    }
    const order: Record<Category, number> = { TOP: 0, LAYER: 1, BOTTOM: 2, SHOES: 3 };
    return [...l].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "worn") return b.wearCount - a.wearCount;
      if (sort === "color") return a.hex.localeCompare(b.hex);
      return order[a.category] - order[b.category] || a.createdAt - b.createdAt;
    });
  }, [items, cat, q, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length, FAV: items.filter((i) => i.favorite).length };
    for (const k of CATEGORIES) c[k.key] = items.filter((i) => i.category === k.key).length;
    return c;
  }, [items]);

  return (
    <div className="safe-bottom">
      <header className="flex items-end justify-between px-5 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Capsule · {items.length} pieces</p>
          <h1 className="mt-1 font-serif text-[30px] leading-none text-ink">Wardrobe</h1>
        </div>
        <button onClick={() => setAddSheetOpen(true)} className="press flex items-center gap-1.5 rounded-full gold-fill px-4 py-2.5 text-xs font-bold text-obsidian shadow-gold">
          <Plus size={14} /> Add piece
        </button>
      </header>

      {/* Search */}
      <div className="mt-5 flex gap-2 px-5">
        <label className="card flex flex-1 items-center gap-2 rounded-2xl px-4 py-3">
          <Search size={15} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, colour, piece…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
          />
        </label>
        <button
          onClick={() => setShowSort((v) => !v)}
          className={cn("press card flex items-center justify-center rounded-2xl px-3.5", showSort && "border-champagne/40 text-champagne")}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
      <AnimatePresence>
        {showSort && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex gap-2 px-5 pt-3">
              {(["recent", "name", "worn", "color"] as Sort[]).map((s) => (
                <Chip key={s} active={sort === s} onClick={() => setSort(s)} tone="emerald">
                  {s === "recent" ? "Curated" : s === "name" ? "A–Z" : s === "worn" ? "Most worn" : "Colour"}
                </Chip>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        <Chip active={cat === "ALL"} onClick={() => setCat("ALL")}>All · {counts.ALL}</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
            {c.plural} · {counts[c.key]}
          </Chip>
        ))}
        <Chip active={cat === "FAV"} onClick={() => setCat("FAV")}>
          <span className="flex items-center gap-1"><Heart size={11} className={cat === "FAV" ? "fill-obsidian" : ""} /> Loved · {counts.FAV}</span>
        </Chip>
      </div>

      {/* Grid */}
      <motion.div layout className="mt-5 grid grid-cols-2 gap-3 px-5">
        <AnimatePresence mode="popLayout">
          {list.map((item, i) => (
            <ItemCard key={item.id} item={item} index={i} onOpen={() => openItem(item.id)} onFav={() => toggleItemFavorite(item.id)} />
          ))}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && (
        <div className="card mx-5 mt-4 rounded-3xl p-8 text-center">
          <p className="font-serif text-lg text-ink">Nothing here yet</p>
          <p className="mt-2 text-xs text-muted">Try another filter, or add a new piece to your capsule.</p>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, index, onOpen, onFav }: { item: WardrobeItem; index: number; onOpen: () => void; onFav: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={onOpen}
      className="card press relative overflow-hidden rounded-[22px] p-1.5 text-left"
    >
      <div className="relative">
        <ItemVisual item={item} className="aspect-[4/5] w-full rounded-2xl" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className="press absolute right-2 top-2 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur"
          aria-label="favorite"
        >
          <Heart size={13} className={item.favorite ? "fill-rose-a text-rose-a" : "text-ink/80"} />
        </button>
        {item.imageId && (
          <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/40 p-1.5 text-emerald-a backdrop-blur">
            <Camera size={11} />
          </span>
        )}
        <span
          className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/90 backdrop-blur"
        >
          {item.subcategory}
        </span>
      </div>
      <div className="px-1.5 pb-1.5 pt-2.5">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-champagne/80">{item.brand}</p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">{item.name.replace(`${item.brand} `, "")}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full ring-1 ring-white/15" style={{ background: item.hex }} />
          <span className="text-[10.5px] text-muted">{item.color}</span>
        </div>
      </div>
    </motion.button>
  );
}
