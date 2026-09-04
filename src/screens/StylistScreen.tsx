import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { OutfitMosaic } from "../components/OutfitCards";
import { Chip, Empty, GoldButton, Palette, ScoreRing, Tag } from "../components/ui";
import { paletteOf, scoreCombo } from "../domain/stylist";
import type { ResolvedOutfit } from "../domain/types";
import { OCCASIONS, WEATHERS, occasionLabel, type Occasion } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { cn } from "../utils/cn";

/**
 * Stylist recommends ONLY from your verified master list of looks —
 * no random or generated combinations. Each suggestion is scored live
 * (harmony / weather / occasion / skin) and ranked.
 */
export function StylistScreen() {
  const { resolved, weatherNow, setWeatherNow, openOutfit } = useAtelier();
  const [occ, setOcc] = useState<Occasion>("SMART_CASUAL");
  const [round, setRound] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [thinking, setThinking] = useState(false);

  const pool = useMemo(() => {
    const sameOcc = resolved.filter((o) => o.occ === occ);
    const exact = sameOcc.filter((o) => o.weather === weatherNow);
    const list = exact.length ? exact : sameOcc;
    return list
      .map((o) => ({ o, s: scoreCombo(o.top, o.bottom, o.shoe, o.occ, o.weather, o.layer) }))
      .sort((a, b) => b.s.score - a.s.score)
      .filter(({ o }) => !dismissed.has(o.id));
  }, [resolved, occ, weatherNow, dismissed]);

  const regenerate = () => {
    setThinking(true);
    window.setTimeout(() => {
      setDismissed((prev) => {
        const next = new Set(prev);
        pool.forEach(({ o }) => next.add(o.id));
        // Wrapped through the whole edit — start over.
        const remaining = resolved.filter((o) => o.occ === occ && !next.has(o.id));
        return remaining.length ? next : new Set<string>();
      });
      setRound((r) => r + 1);
      setThinking(false);
    }, 650);
  };

  const best = pool[0];

  return (
    <div className="safe-bottom">
      <header className="px-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Personal Stylist</p>
        <h1 className="mt-1 font-serif text-[30px] leading-none text-ink">
          Compose a <span className="italic gold-text">Look</span>
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Only your verified combinations — ranked by colour harmony, warm-skin lift, occasion fit and weather. No random mixes.
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
              <p className="mt-4 font-serif text-lg text-ink">Pulling your next look…</p>
              <p className="mt-1 text-[11px] text-muted">From your verified combinations only</p>
            </motion.div>
          ) : best ? (
            <motion.div key={best.o.id + round} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} className="card grain relative mt-3 overflow-hidden rounded-[28px] p-3 shadow-card">
              <OutfitMosaic o={best.o} className="h-52" />
              <div className="px-2 pb-1 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Tag tone="gold"><Sparkles size={10} /> Stylist's pick</Tag>
                    <h3 className="mt-2 font-serif text-[24px] leading-tight text-ink">{best.o.title}</h3>
                  </div>
                  <ScoreRing value={best.s.score} size={52} label="match" />
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">{best.o.styleTip}</p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(
                    [
                      ["Harmony", best.s.breakdown.harmony],
                      ["Weather", best.s.breakdown.weather],
                      ["Occasion", best.s.breakdown.occasion],
                      ["Skin", best.s.breakdown.skin],
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
                  <Palette colors={paletteOf(best.o)} size={16} className="mr-auto" />
                  <ViewButton o={best.o} onOpen={openOutfit} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
              <Empty title="No verified looks here yet" body={`Nothing in your master list matches ${occasionLabel(occ)} right now. Try another occasion or weather.`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alternatives */}
      {pool.length > 1 && !thinking && (
        <section className="mt-7">
          <div className="px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Alternatives</p>
            <h2 className="mt-1 font-serif text-[22px] text-ink">{occasionLabel(occ)} · more options</h2>
          </div>
          <div className="mt-3 space-y-3 px-5">
            {pool.slice(1, 5).map(({ o }, i) => (
              <motion.div key={o.id + round} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="card flex gap-3 rounded-3xl p-2.5">
                <OutfitMosaic o={o} className="h-28 w-[132px] shrink-0" rounded="rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-serif text-[16px] leading-tight text-ink">{o.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                    {o.top.color} · {o.bottom.color}{o.layer ? ` · ${o.layer.color}` : ""}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <Palette colors={paletteOf(o)} size={12} />
                    <ViewButton compact o={o} onOpen={openOutfit} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 px-5">
        <GoldButton onClick={regenerate}>
          <RefreshCw size={15} /> Show another look
        </GoldButton>
      </div>
    </div>
  );
}

function ViewButton({ o, onOpen, compact }: { o: ResolvedOutfit; onOpen: (id: string) => void; compact?: boolean }) {
  return (
    <button onClick={() => onOpen(o.id)} className={cn("press flex items-center gap-1.5 rounded-full gold-fill font-bold text-obsidian shadow-gold", compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs")}>
      View look <ArrowUpRight size={13} />
    </button>
  );
}
