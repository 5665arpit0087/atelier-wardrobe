import hero from "../assets/hero.jpg";
import { motion } from "framer-motion";
import { ArrowUpRight, Flame, Heart, Shirt, Sparkles, Sun, Thermometer, Wind } from "lucide-react";
import { useMemo } from "react";
import { OutfitMosaic, OutfitRailCard } from "../components/OutfitCards";
import { Palette, SectionHeader, Tag } from "../components/ui";
import { paletteOf } from "../domain/stylist";
import { OCCASIONS, WEATHERS, occasionLabel, weatherLabel, type Weather } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { cn } from "../utils/cn";

const weatherIcon: Record<Weather, typeof Sun> = { HOT: Flame, PLEASANT: Sun, COOL: Wind };

export function HomeScreen() {
  const { resolved, items, meta, weatherNow, setWeatherNow, openOutfit, setScreen } = useAtelier();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  // Today's edit: deterministic daily rotation among looks that suit the current weather.
  const todays = useMemo(() => {
    const pool = resolved.filter((o) => o.weather === weatherNow);
    const list = pool.length ? pool : resolved;
    if (!list.length) return null;
    const day = Math.floor(Date.now() / 86_400_000);
    return list[day % list.length];
  }, [resolved, weatherNow]);

  const favorites = resolved.filter((o) => o.favorite);
  const wears = resolved.reduce((a, o) => a + o.wearCount, 0);
  const stats = [
    { label: "Pieces", value: items.length, icon: Shirt },
    { label: "Looks", value: resolved.length, icon: Sparkles },
    { label: "Loved", value: favorites.length + items.filter((i) => i.favorite).length, icon: Heart },
    { label: "Worn", value: wears, icon: Flame },
  ];

  const swatches = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((i) => (seen.has(i.hex) ? false : (seen.add(i.hex), true))).slice(0, 14);
  }, [items]);

  return (
    <div className="safe-bottom">
      {/* Header */}
      <header className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">{dateStr}</p>
          <h1 className="mt-1.5 font-serif text-[30px] leading-[1.05] text-ink">
            {greeting},
            <br />
            <span className="gold-text italic">{meta.name.split(" ")[0]}</span>
          </h1>
        </div>
        <button onClick={() => setScreen("profile")} className="press relative mt-1 h-11 w-11 overflow-hidden rounded-2xl border border-champagne/30 gold-fill shadow-gold">
          <span className="absolute inset-0 flex items-center justify-center font-serif text-lg font-semibold text-obsidian">
            {meta.name.trim().charAt(0).toUpperCase() || "A"}
          </span>
        </button>
      </header>

      {/* Weather selector */}
      <div className="mt-5 px-5">
        <div className="card flex items-center gap-1 rounded-2xl p-1">
          <div className="flex items-center gap-1.5 pl-3 pr-2 text-muted">
            <Thermometer size={13} />
          </div>
          {WEATHERS.map((w) => {
            const Icon = weatherIcon[w.key];
            const active = weatherNow === w.key;
            return (
              <button
                key={w.key}
                onClick={() => setWeatherNow(w.key)}
                className={cn(
                  "press relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors",
                  active ? "text-obsidian" : "text-muted",
                )}
              >
                {active && (
                  <motion.span layoutId="weatherPill" className="absolute inset-0 rounded-xl gold-fill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <Icon size={13} className="relative" />
                <span className="relative">{w.label}</span>
                <span className={cn("relative hidden text-[10px] font-medium min-[380px]:inline", active ? "text-obsidian/70" : "text-muted/60")}>{w.temp}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's edit hero */}
      {todays && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-6 px-5"
        >
          <button onClick={() => openOutfit(todays.id)} className="press card grain relative block w-full overflow-hidden rounded-[30px] text-left shadow-card">
            <div className="absolute inset-0">
              <img src={hero} alt="" className="h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-obsidian/30 via-obsidian/70 to-[#0d131c]" />
            </div>
            <div className="relative p-5">
              <div className="flex items-center justify-between">
                <Tag tone="gold">
                  <Sparkles size={10} /> Today's Edit
                </Tag>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{weatherLabel(todays.weather)} · {occasionLabel(todays.occ)}</span>
              </div>
              <h2 className="mt-8 font-serif text-[34px] leading-[1.02] text-ink">{todays.title}</h2>
              <p className="mt-2 max-w-[90%] text-[12.5px] leading-relaxed text-muted">{todays.styleTip}</p>
              <div className="mt-5">
                <OutfitMosaic o={todays} className="h-40" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Palette colors={paletteOf(todays)} size={16} />
                <span className="flex items-center gap-1 text-xs font-semibold text-champagne">
                  View look <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          </button>
        </motion.section>
      )}

      {/* Stats */}
      <div className="mt-5 grid grid-cols-4 gap-2 px-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="card flex flex-col items-center rounded-2xl py-3"
          >
            <s.icon size={13} className="text-champagne/80" />
            <span className="mt-1.5 font-serif text-xl leading-none text-ink">{s.value}</span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Stylist CTA */}
      <div className="mt-5 px-5">
        <button onClick={() => setScreen("stylist")} className="press card shimmer relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border-champagne/20 p-4 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-champagne/10 text-champagne ring-1 ring-champagne/30">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg text-ink">Ask the Stylist</p>
            <p className="text-[11.5px] text-muted">Generate a new look tuned to your build, tone & the weather.</p>
          </div>
          <ArrowUpRight size={18} className="text-champagne" />
        </button>
      </div>

      {/* Occasion rails */}
      {OCCASIONS.map((occ) => {
        const list = resolved.filter((o) => o.occ === occ.key);
        if (!list.length) return null;
        const sorted = [...list].sort((a, b) => (a.weather === weatherNow ? -1 : 0) - (b.weather === weatherNow ? -1 : 0));
        return (
          <section key={occ.key} className="mt-8">
            <SectionHeader eyebrow={occ.blurb} title={occ.label} action="See all" onAction={() => setScreen("looks")} />
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
              {sorted.map((o) => (
                <OutfitRailCard key={o.id} o={o} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Palette */}
      <section className="mt-8">
        <SectionHeader eyebrow="Warm skin · Athletic build" title="Your Capsule Palette" />
        <div className="card mx-5 mt-4 rounded-3xl p-4">
          <div className="flex flex-wrap gap-2">
            {swatches.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] py-1 pl-1 pr-3">
                <span className="h-5 w-5 rounded-full ring-1 ring-white/10" style={{ background: s.hex }} />
                <span className="text-[10.5px] font-medium text-muted">{s.color}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
            Earth tones (camel, olive, rust, khaki) sit in harmony with tan skin; jewel tones (forest, teal, wine) add depth by contrast. Black and charcoal anchor the silhouette and sharpen the V-taper.
          </p>
        </div>
      </section>
    </div>
  );
}
