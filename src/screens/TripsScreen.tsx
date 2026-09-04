import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Briefcase, Check, Coffee, Dumbbell, Luggage, Moon, Plane, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { OutfitMosaic } from "../components/OutfitCards";
import { ItemVisual } from "../components/ItemVisual";
import { Chip, Empty, GoldButton, Tag } from "../components/ui";
import { planTrip, TRIP_DAY_OPTIONS, TRIP_VIBES, type TripDays, type TripPlan, type TripVibe } from "../domain/trip";
import { WEATHERS, occasionLabel, weatherLabel, type WardrobeItem, type Weather } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { cn } from "../utils/cn";

const VIBE_ICON: Record<TripVibe, typeof Coffee> = {
  CHILL: Coffee,
  SMART: Briefcase,
  NIGHTS: Moon,
  ACTIVE: Dumbbell,
  MIXED: Shuffle,
};

export function TripsScreen() {
  const { resolved, weatherNow } = useAtelier();
  const [days, setDays] = useState<TripDays>(3);
  const [climate, setClimate] = useState<Weather>(weatherNow);
  const [vibe, setVibe] = useState<TripVibe>("MIXED");
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [failed, setFailed] = useState(false);
  const [packing, setPacking] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const dayCount = TRIP_DAY_OPTIONS.find((d) => d.value === days)?.days ?? 3;

  const generate = () => {
    setPacking(true);
    setFailed(false);
    window.setTimeout(() => {
      const plan = planTrip(resolved, dayCount, climate, vibe);
      setTrip(plan);
      setFailed(!plan);
      setChecked(new Set());
      setPacking(false);
    }, 700);
  };

  const touch = (fn: () => void) => () => {
    setTrip(null);
    setFailed(false);
    fn();
  };

  const packGroups = useMemo(() => {
    if (!trip) return [];
    return [
      { key: "tops", title: "Tops", items: trip.packTops },
      { key: "bottoms", title: "Bottoms · re-worn", items: trip.packBottoms },
      { key: "shoes", title: "Shoes", items: trip.packShoes },
      { key: "layers", title: "Layers", items: trip.packLayers },
    ].filter((g) => g.items.length > 0);
  }, [trip]);

  const totalCheckable = packGroups.reduce((a, g) => a + g.items.length, 0);
  const itemName = useMemo(() => {
    const m = new Map<string, string>();
    trip?.days.forEach((d) => {
      [d.look.top, d.look.layer, d.look.bottom, d.look.shoe].forEach((p) => {
        if (p) m.set(p.id, p.subcategory);
      });
    });
    return m;
  }, [trip]);

  return (
    <div className="safe-bottom">
      <header className="px-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Trip Packer</p>
        <h1 className="mt-1 font-serif text-[30px] leading-none text-ink">
          Pack <span className="italic gold-text">light</span>
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          An optimized capsule from your wardrobe. Bottoms and shoes re-worn across days — nothing extra.
        </p>
      </header>

      {/* Inputs */}
      <div className="mt-5 space-y-4 px-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Trip length</p>
          <div className="flex flex-wrap gap-2">
            {TRIP_DAY_OPTIONS.map((d) => (
              <Chip key={d.value} active={days === d.value} onClick={touch(() => setDays(d.value))}>
                {d.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Climate</p>
          <div className="flex flex-wrap gap-2">
            {WEATHERS.map((w) => (
              <Chip key={w.key} active={climate === w.key} onClick={touch(() => setClimate(w.key))}>
                {w.label} <span className="ml-1 opacity-60">{w.temp}</span>
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Trip vibe</p>
          <div className="grid grid-cols-2 gap-2">
            {TRIP_VIBES.map((v) => {
              const Icon = VIBE_ICON[v.key];
              const active = vibe === v.key;
              return (
                <button
                  key={v.key}
                  onClick={touch(() => setVibe(v.key))}
                  aria-pressed={active}
                  className={cn(
                    "press card flex items-center gap-3 rounded-2xl p-3 text-left transition",
                    active ? "border-champagne/50 bg-champagne/[0.08]" : "",
                  )}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", active ? "bg-champagne/15 text-champagne ring-champagne/30" : "bg-white/[0.04] text-muted ring-white/10")}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span>
                    <span className={cn("block font-serif text-[15px]", active ? "text-champagne" : "text-ink")}>{v.label}</span>
                    <span className="block text-[10.5px] text-muted">{v.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <GoldButton onClick={generate} disabled={packing}>
          <Luggage size={16} aria-hidden="true" /> {packing ? "Packing your bag…" : trip ? "Repack for this trip" : "Pack my bag"}
        </GoldButton>
      </div>

      <AnimatePresence mode="wait">
        {packing ? (
          <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card mx-5 mt-6 flex h-44 flex-col items-center justify-center rounded-[28px]">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }} className="text-champagne">
              <Plane size={26} aria-hidden="true" />
            </motion.div>
            <p className="mt-4 font-serif text-lg text-ink">Folding {dayCount} days into a carry-on…</p>
            <p className="mt-1 text-[11px] text-muted">Re-wearing bottoms · doubling shoes</p>
          </motion.div>
        ) : failed ? (
          <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <Empty title="Wardrobe too thin for this trip" body="Add more pieces to your wardrobe first — the packer needs tops, bottoms and shoes to build days." />
          </motion.div>
        ) : trip ? (
          <motion.div key="trip" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TravelDay trip={trip} />
            <Checklist
              groups={packGroups}
              checked={checked}
              total={totalCheckable}
              onToggle={(id) =>
                setChecked((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
            />
            <Itinerary trip={trip} itemName={itemName} />
            {trip.sixPlus && (
              <p className="mx-5 mt-4 text-[11.5px] leading-relaxed text-muted">
                Day 7 and beyond: re-wear your Day 1–2 favorites — the capsule covers it.
              </p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ───────── 1 · Wear on travel day ───────── */

function TravelDay({ trip }: { trip: TripPlan }) {
  const { openOutfit } = useAtelier();
  const t = trip.travelLook;
  const bits: string[] = [];
  if (t.layer) bits.push(`wear the ${t.layer.subcategory.toLowerCase()}`);
  bits.push(`wear the ${t.shoe.subcategory.toLowerCase()}`);
  return (
    <section className="mt-7 px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">1 · Wear on travel day</p>
      <h2 className="mt-1 font-serif text-[22px] text-ink">Board in the bulkiest pieces</h2>
      <button onClick={() => openOutfit(t.id)} aria-label={`Open travel outfit ${t.title}`} className="card grain press relative mt-3 block w-full overflow-hidden rounded-[28px] p-3 text-left shadow-card">
        <OutfitMosaic o={t} className="h-44" />
        <div className="px-2 pb-1 pt-3">
          <div className="flex flex-wrap gap-2">
            <Tag tone="gold"><Plane size={10} /> Travel fit</Tag>
            <Tag tone="emerald">{weatherLabel(trip.weather)}</Tag>
          </div>
          <p className="mt-2 font-serif text-[20px] leading-tight text-ink">{t.title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted capitalize">
            {bits.join(" + ")} — bulkiest pieces stay on you, not in the bag.
          </p>
        </div>
      </button>
    </section>
  );
}

/* ───────── 2 · Luggage checklist ───────── */

function Checklist({
  groups,
  checked,
  total,
  onToggle,
}: {
  groups: { key: string; title: string; items: WardrobeItem[] }[];
  checked: Set<string>;
  total: number;
  onToggle: (id: string) => void;
}) {
  const pct = total ? Math.round((checked.size / total) * 100) : 0;
  return (
    <section className="mt-7 px-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">2 · Luggage checklist</p>
          <h2 className="mt-1 font-serif text-[22px] text-ink">{total} pieces · carry-on only</h2>
        </div>
        <span className="text-[11px] font-semibold text-champagne">{checked.size}/{total} packed</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} className="h-full rounded-full gold-fill" />
      </div>
      {groups.map((g) => (
        <div key={g.key} className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{g.title} · {g.items.length}</p>
          <div className="card divide-y divide-white/[0.06] rounded-2xl">
            {g.items.map((item) => {
              const done = checked.has(item.id);
              return (
                <button
                  key={item.id}
                  role="checkbox"
                  aria-checked={done}
                  onClick={() => onToggle(item.id)}
                  className="press flex w-full items-center gap-3 px-3 py-2.5 text-left"
                >
                  <ItemVisual item={item} className="h-12 w-12 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px] font-medium", done ? "text-muted line-through" : "text-ink")}>
                      {item.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                      <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/15" style={{ background: item.hex }} /> {item.color}
                    </span>
                  </span>
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition", done ? "border-champagne bg-champagne text-obsidian" : "border-white/15 text-transparent")}>
                    <Check size={14} aria-hidden="true" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ───────── 3 · Day-by-day itinerary ───────── */

function Itinerary({ trip, itemName }: { trip: TripPlan; itemName: Map<string, string> }) {
  const { openOutfit } = useAtelier();
  return (
    <section className="mt-7">
      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">3 · Day-by-day itinerary</p>
        <h2 className="mt-1 font-serif text-[22px] text-ink">Exact outfits, Day 1–{trip.dayCount}</h2>
      </div>
      <div className="mt-3 space-y-3 px-5">
        {trip.days.map((d, i) => (
          <motion.div
            key={d.look.id + d.day}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 6) * 0.06 }}
            className="card overflow-hidden rounded-[26px] p-2.5 shadow-card"
          >
            <button onClick={() => openOutfit(d.look.id)} className="block w-full text-left" aria-label={`Open ${d.look.title}`}>
              <OutfitMosaic o={d.look} className="h-40" />
            </button>
            <div className="flex items-start justify-between gap-3 px-2 pb-2 pt-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag tone="gold">Day {d.day}</Tag>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    {occasionLabel(d.look.occ)} · {weatherLabel(d.look.weather)}
                  </span>
                </div>
                <p className="mt-1.5 truncate font-serif text-[19px] text-ink">{d.look.title}</p>
                {d.rewornIds.length > 0 && (
                  <p className="mt-1 text-[10.5px] text-emerald-a">
                    Re-wearing {d.rewornIds.map((id) => itemName.get(id) ?? "a favorite").join(" · ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => openOutfit(d.look.id)}
                aria-label={`View ${d.look.title}`}
                className="press shrink-0 rounded-full gold-fill p-2.5 text-obsidian shadow-gold"
              >
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
