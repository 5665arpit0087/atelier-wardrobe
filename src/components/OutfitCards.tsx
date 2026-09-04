import { motion } from "framer-motion";
import { Heart, Layers } from "lucide-react";
import type { ResolvedOutfit, WardrobeItem } from "../domain/types";
import { occasionLabel, weatherLabel } from "../domain/types";
import { paletteOf } from "../domain/stylist";
import { useAtelier } from "../store/AtelierStore";
import { cn } from "../utils/cn";
import { ItemVisual } from "./ItemVisual";
import { Palette, Tag } from "./ui";

export interface Composition {
  top: WardrobeItem;
  layer?: WardrobeItem;
  bottom: WardrobeItem;
  shoe: WardrobeItem;
}

/** Mosaic of the pieces that make up a look. */
export function OutfitMosaic({ o, className, rounded = "rounded-2xl" }: { o: Composition; className?: string; rounded?: string }) {
  return (
    <div className={cn("grid grid-cols-5 grid-rows-2 gap-1.5", className)}>
      <div className={cn("relative col-span-3 row-span-2 overflow-hidden", rounded)}>
        <ItemVisual item={o.top} className="h-full w-full" />
        {o.layer && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 py-1 pl-1 pr-2.5 backdrop-blur">
            <ItemVisual item={o.layer} className="h-6 w-6 rounded-full" iconClassName="h-[80%] w-[80%]" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-ink/90">{o.layer.subcategory}</span>
          </div>
        )}
      </div>
      <ItemVisual item={o.bottom} className={cn("col-span-2 h-full w-full", rounded)} />
      <ItemVisual item={o.shoe} className={cn("col-span-2 h-full w-full", rounded)} />
    </div>
  );
}

export function OutfitCard({ o, index = 0 }: { o: ResolvedOutfit; index?: number }) {
  const { openOutfit, toggleOutfitFavorite } = useAtelier();
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="card press relative overflow-hidden rounded-[26px] p-2.5 shadow-card"
      onClick={() => openOutfit(o.id)}
    >
      <OutfitMosaic o={o} className="h-44" />
      <div className="flex items-start justify-between gap-3 px-2 pb-2 pt-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Tag tone="gold">{occasionLabel(o.occ)}</Tag>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted">{weatherLabel(o.weather)}</span>
          </div>
          <h3 className="mt-2 truncate font-serif text-[19px] leading-tight text-ink">{o.title}</h3>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{o.styleTip}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOutfitFavorite(o.id);
            }}
            className="press rounded-full border border-white/10 bg-white/[0.04] p-2"
            aria-label="favorite"
          >
            <Heart size={15} className={o.favorite ? "fill-rose-a text-rose-a" : "text-muted"} />
          </button>
          <Palette colors={paletteOf(o)} size={12} />
        </div>
      </div>
    </motion.article>
  );
}

export function OutfitRailCard({ o }: { o: ResolvedOutfit }) {
  const { openOutfit } = useAtelier();
  return (
    <button onClick={() => openOutfit(o.id)} className="card press w-[168px] shrink-0 overflow-hidden rounded-3xl p-2 text-left">
      <div className="relative h-[150px] overflow-hidden rounded-2xl">
        <ItemVisual item={o.top} className="h-full w-full" />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <ItemVisual item={o.bottom} className="h-9 w-9 rounded-lg ring-1 ring-black/40" iconClassName="h-[80%] w-[80%]" />
          <ItemVisual item={o.shoe} className="h-9 w-9 rounded-lg ring-1 ring-black/40" iconClassName="h-[80%] w-[80%]" />
        </div>
        {o.layer && (
          <div className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur">
            <Layers size={11} className="text-champagne" />
          </div>
        )}
      </div>
      <div className="px-1.5 pb-1 pt-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-champagne/80">{occasionLabel(o.occ)}</p>
        <p className="mt-0.5 truncate font-serif text-[15px] text-ink">{o.title}</p>
      </div>
    </button>
  );
}
