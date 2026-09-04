import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, Check, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { OutfitMosaic } from "../components/OutfitCards";
import { Chip, GoldButton, Palette, ScoreRing, Tag } from "../components/ui";
import { comboKey, craftTip, generateLooks, paletteOf, type ScoredOutfit } from "../domain/stylist";
import { OCCASIONS, WEATHERS, occasionLabel, type Occasion } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { cn } from "../utils/cn";

export function StylistScreen() {
  const { items, outfits, weatherNow, setWeatherNow, addOutfit, openOutfit } = useAtelier();
  const [occ, setOcc] = useState<Occasion>("SMART_CASUAL");
  const [round, setRound] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [thinking, setThinking] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});

  const looks = useMemo(
    () => generateLooks(items, occ, weatherNow, { limit: 5, exclude: dismissed }),
    [items, occ, weatherNow, dismissed, round],
  );

  const existingKeys = useMemo(() => {
    const m: Record<string, string> = {};
    for (const o of outfits) m[[o.topId, o.layerId ?? "-", o.bottomId, o.shoeId].join("|")] = o.id;
    return m;
  }, [outfits]);

  const regenerate = () => {
    setThinking(true);
    const next = new Set(dismissed);
    looks.forEach((l) => next.add(comboKey(l)));
    window.setTimeout(() => {
      // If we've exhausted the space, start again.
      const remaining = generateLooks(items, occ, weatherNow, { limit: 1, exclude: next });
      setDismissed(remaining.length ? next : new Set());
      setRound((r) => r + 1);
      setThinking(false);
    }, 650);
  };

  const save = (l: ScoredOutfit) => {
    const key = comboKey(l);
    if (savedKeys[key] || existingKeys[key]) return;
    const title = autoTitle(l);
    const outfit = addOutfit({
      title,
      occ,
      weather: weatherNow,
      topId: l.top.id,
      layerId: l.layer?.id,
      bottomId: l.bottom.id,
      shoeId: l.shoe.id,
      styleTip: craftTip(l, occ, weatherNow),
    });
    setSavedKeys((s) => ({ ...s, [key]: outfit.id }));
  };

  const best = looks[0];

  return (
    <div className="safe-bottom">
      <header className="px-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Personal Stylist</p>
        <h1 className="mt-1 font-serif text-[30px] leading-none text-ink">
          Compose a <span className="italic gold-text">Look</span>
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Scored on colour harmony, warm-skin lift, occasion fit and weather. Built for broad shoulders and a defined jaw.
        </p>
      </header>

      {/* Controls */}
      <div className="mt-5 px-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Occasion</p>
        <div className="grid grid-cols-2 gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => { setOcc(o.key); setDismissed(new Set()); }}
              className={cn(
                "press card rounded-2xl p-3 text-left transition",
                occ === o.key ? "border-champagne/50 bg-champagne/[0.08]" : "",
              )}
            >
              <p className={cn("font-serif text-[15px]", occ === o.key ? "text-champagne" : "text-ink")}>{o.label}</p>
              <p className="mt-0.5 text-[10.5px] text-muted">{o.blurb}</p>
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Weather</p>
        <div className="flex gap-2">
          {WEATHERS.map((w) => (
            <Chip key={w.key} active={weatherNow === w.key} onClick={() => { setWeatherNow(w.key); setDismissed(new Set()); }}>
              {w.label} <span className="ml-1 opacity-60">{w.temp}</span>
            </Chip>
          ))}
        </div>
      </div>

      {/* Hero recommendation */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Top recommendation</p>
          <button onClick={regenerate} className="press flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <RefreshCw size={13} className={thinking ? "animate-spin" : ""} /> Shuffle
          </button>
        </div>
        <AnimatePresence mode="wait">
          {thinking ? (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card mt-3 flex h-[340px] flex-col items-center justify-center rounded-[28px]">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }} className="text-champagne">
                <Wand2 size={26} />
              </motion.div>
              <p className="mt-4 font-serif text-lg text-ink">Tailoring combinations…</p>
              <p className="mt-1 text-[11px] text-muted">Balancing hue, luminance & drape</p>
            </motion.div>
          ) : best ? (
            <motion.div key={comboKey(best) + round} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} className="card grain relative mt-3 overflow-hidden rounded-[28px] p-3 shadow-card">
              <OutfitMosaic o={best} className="h-52" />
              <div className="px-2 pb-1 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Tag tone="gold"><Sparkles size={10} /> Stylist's pick</Tag>
                    <h3 className="mt-2 font-serif text-[24px] leading-tight text-ink">{autoTitle(best)}</h3>
                  </div>
                  <ScoreRing value={best.score} size={52} label="match" />
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">{craftTip(best, occ, weatherNow)}</p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(
                    [
                      ["Harmony", best.breakdown.harmony],
                      ["Weather", best.breakdown.weather],
                      ["Occasion", best.breakdown.occasion],
                      ["Skin", best.breakdown.skin],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${v * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full gold-fill" />
                      </div>
                      <p className="mt-1.5 text-[9px] uppercase tracking-wider text-muted">{k}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Palette colors={paletteOf(best)} size={16} className="mr-auto" />
                  <SaveButton l={best} savedId={savedKeys[comboKey(best)] ?? existingKeys[comboKey(best)]} onSave={() => save(best)} onOpen={openOutfit} />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Alternatives */}
      {looks.length > 1 && !thinking && (
        <section className="mt-7">
          <div className="px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Alternatives</p>
            <h2 className="mt-1 font-serif text-[22px] text-ink">{occasionLabel(occ)} · more options</h2>
          </div>
          <div className="mt-3 space-y-3 px-5">
            {looks.slice(1).map((l, i) => {
              const key = comboKey(l);
              return (
                <motion.div key={key + round} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="card flex gap-3 rounded-3xl p-2.5">
                  <OutfitMosaic o={l} className="h-28 w-[132px] shrink-0" rounded="rounded-xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-serif text-[16px] leading-tight text-ink">{autoTitle(l)}</p>
                      <ScoreRing value={l.score} size={38} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {l.top.color} · {l.bottom.color}{l.layer ? ` · ${l.layer.color}` : ""}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <Palette colors={paletteOf(l)} size={12} />
                      <SaveButton compact l={l} savedId={savedKeys[key] ?? existingKeys[key]} onSave={() => save(l)} onOpen={openOutfit} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6 px-5">
        <GoldButton onClick={regenerate}>
          <RefreshCw size={15} /> Generate fresh looks
        </GoldButton>
      </div>
    </div>
  );
}

function SaveButton({ l, savedId, onSave, onOpen, compact }: { l: ScoredOutfit; savedId?: string; onSave: () => void; onOpen: (id: string) => void; compact?: boolean }) {
  void l;
  if (savedId)
    return (
      <button onClick={() => onOpen(savedId)} className={cn("press flex items-center gap-1.5 rounded-full border border-emerald-a/40 bg-emerald-a/10 font-semibold text-emerald-a", compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs")}>
        <Check size={13} /> Saved
      </button>
    );
  return (
    <button onClick={onSave} className={cn("press flex items-center gap-1.5 rounded-full gold-fill font-bold text-obsidian shadow-gold", compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs")}>
      <BookmarkPlus size={13} /> Save look
    </button>
  );
}

const adjectives: Record<string, string> = {
  "Forest Green": "Forest", "Wine Maroon": "Crimson", "Dusty Mauve": "Mauve", "Navy/Green": "Plaid", "Burnt Orange": "Rust",
  "Olive Green": "Olive", "Deep Teal": "Teal", "Olive Melange": "Olive", "Camel Brown": "Camel", "Burgundy Maroon": "Burgundy",
  "Solid Black": "Stealth", "Jet Black": "Noir", "Warm Khaki Beige": "Khaki", "Charcoal Grey": "Charcoal", "Medium Blue": "Denim",
  "Light Blue": "Sky", "Deep Green": "Evergreen", "Sage Green": "Sage", "Off-White/Green": "Court", "Heather Grey": "Knit", "Black/Multi": "Runner",
};

export function autoTitle(l: { top: { color: string }; bottom: { color: string }; layer?: { color: string } }) {
  const a = adjectives[l.layer?.color ?? l.top.color] ?? (l.layer?.color ?? l.top.color).split(" ")[0];
  const b = adjectives[l.bottom.color] ?? l.bottom.color.split(" ")[0];
  return a === b ? `${a} Monochrome` : `${a} & ${b}`;
}
