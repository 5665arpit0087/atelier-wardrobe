import { motion } from "framer-motion";
import { CheckCircle2, Heart, Quote, Trash2 } from "lucide-react";
import { useState } from "react";
import { paletteOf, scoreCombo } from "../domain/stylist";
import { occasionLabel, weatherLabel, type WardrobeItem } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { ItemVisual } from "./ItemVisual";
import { GhostButton, GoldButton, Palette, ScoreRing, Sheet, Tag } from "./ui";

export function OutfitDetailSheet() {
  const { selectedOutfitId, openOutfit, resolved, toggleOutfitFavorite, logWear, deleteOutfit, openItem } = useAtelier();
  const o = resolved.find((x) => x.id === selectedOutfitId);
  const [confirm, setConfirm] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const score = o ? scoreCombo(o.top, o.bottom, o.shoe, o.occ, o.weather, o.layer) : null;

  const pieces: { role: string; item: WardrobeItem }[] = o
    ? [
        ...(o.layer ? [{ role: "Layer", item: o.layer }] : []),
        { role: "Top", item: o.top },
        { role: "Bottom", item: o.bottom },
        { role: "Footwear", item: o.shoe },
      ]
    : [];

  return (
    <Sheet open={!!o} onClose={() => { openOutfit(null); setConfirm(false); setJustLogged(false); }} full>
      {o && score && (
        <div className="pb-10">
          {/* Hero composition */}
          <div className="relative mx-4 overflow-hidden rounded-[26px]">
            <div className="grid grid-cols-2 gap-1.5">
              <ItemVisual item={o.top} className="col-span-2 h-56" />
              <ItemVisual item={o.bottom} className="h-32" />
              <ItemVisual item={o.shoe} className="h-32" />
            </div>
            {o.layer && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 py-1 pl-1 pr-3 backdrop-blur">
                <ItemVisual item={o.layer} className="h-7 w-7 rounded-full" iconClassName="h-[80%] w-[80%]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink">+ {o.layer.subcategory}</span>
              </div>
            )}
            <button onClick={() => toggleOutfitFavorite(o.id)} className="press absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-2.5 backdrop-blur">
              <Heart size={18} className={o.favorite ? "fill-rose-a text-rose-a" : "text-ink"} />
            </button>
          </div>

          <div className="mt-5 px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Tag tone="gold">{occasionLabel(o.occ)}</Tag>
                  <Tag tone="emerald">{weatherLabel(o.weather)}</Tag>
                  {o.custom && <Tag>Your creation</Tag>}
                </div>
                <h2 className="mt-3 font-serif text-[30px] leading-[1.05] text-ink">{o.title}</h2>
              </div>
              <ScoreRing value={score.score} size={56} label="match" />
            </div>

            <div className="card relative mt-4 rounded-2xl p-4 pl-11">
              <Quote size={16} className="absolute left-4 top-4 text-champagne" />
              <p className="font-serif text-[15px] italic leading-relaxed text-ink/90">{o.styleTip}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Palette colors={paletteOf(o)} size={18} />
              <p className="text-[11px] text-muted">
                Worn {o.wearCount}× {o.lastWorn && `· last ${new Date(o.lastWorn).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
              </p>
            </div>
          </div>

          {/* Pieces */}
          <div className="mt-6 px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">The pieces</p>
            <div className="mt-3 space-y-2">
              {pieces.map((p, i) => (
                <motion.button
                  key={p.item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => openItem(p.item.id)}
                  className="card press flex w-full items-center gap-3 rounded-2xl p-2 text-left"
                >
                  <ItemVisual item={p.item} className="h-16 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">{p.role} · {p.item.brand}</p>
                    <p className="truncate text-[13px] font-medium text-ink">{p.item.name.replace(`${p.item.brand} `, "")}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                      <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/15" style={{ background: p.item.hex }} /> {p.item.color}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-6 px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Why it works</p>
            <div className="card mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl p-4">
              {(
                [
                  ["Colour harmony", score.breakdown.harmony],
                  ["Weather fit", score.breakdown.weather],
                  ["Occasion fit", score.breakdown.occasion],
                  ["Warm-skin lift", score.breakdown.skin],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-ink">{k}</span>
                    <span className="text-muted">{Math.round(v * 100)}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${v * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full gold-fill" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-2 px-5">
            <GoldButton onClick={() => { logWear(o.id); setJustLogged(true); }}>
              <CheckCircle2 size={16} /> {justLogged ? "Logged — wear it well" : "Wearing this today"}
            </GoldButton>
            {!confirm ? (
              <GhostButton danger onClick={() => setConfirm(true)} className="w-full">
                <Trash2 size={15} /> Remove look
              </GhostButton>
            ) : (
              <div className="flex gap-2">
                <GhostButton onClick={() => setConfirm(false)} className="flex-1">Keep</GhostButton>
                <GhostButton danger onClick={() => deleteOutfit(o.id)} className="flex-1">Confirm remove</GhostButton>
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
