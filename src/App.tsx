import hero from "./assets/hero.jpg";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Home, Shirt, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AddItemSheet } from "./components/AddItemSheet";
import { ItemDetailSheet } from "./components/ItemDetailSheet";
import { OutfitDetailSheet } from "./components/OutfitDetailSheet";
import { GoldButton } from "./components/ui";
import { HomeScreen } from "./screens/HomeScreen";
import { LooksScreen } from "./screens/LooksScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { StylistScreen } from "./screens/StylistScreen";
import { WardrobeScreen } from "./screens/WardrobeScreen";
import { AtelierProvider, useAtelier, type Screen } from "./store/AtelierStore";
import { cn } from "./utils/cn";

const NAV: { key: Screen; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Today", icon: Home },
  { key: "wardrobe", label: "Wardrobe", icon: Shirt },
  { key: "stylist", label: "Stylist", icon: Sparkles },
  { key: "looks", label: "Looks", icon: BookOpen },
  { key: "profile", label: "Profile", icon: User },
];

export default function App() {
  return (
    <AtelierProvider>
      <DeviceFrame>
        <Shell />
      </DeviceFrame>
    </AtelierProvider>
  );
}

/** On large screens the app sits inside a phone-like frame; on mobile it is full-bleed. */
function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-obsidian md:flex md:items-center md:justify-center md:py-8">
      <div className="pointer-events-none fixed inset-0 hidden md:block">
        <div className="absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-champagne/[0.05] blur-[140px]" />
        <div className="absolute left-[20%] top-[70%] h-[40vh] w-[40vh] rounded-full bg-emerald-a/[0.05] blur-[120px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
          <p className="font-serif text-2xl italic text-ink/30">Atelier</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted/40">Personal stylist · Capsule wardrobe</p>
        </div>
      </div>
      <div className="relative mx-auto h-dvh w-full overflow-hidden bg-obsidian md:h-[min(92vh,900px)] md:w-[420px] md:rounded-[44px] md:border md:border-white/10 md:shadow-[0_40px_120px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        {children}
      </div>
    </div>
  );
}

function Shell() {
  const { ready, screen, setScreen, meta, updateMeta, toast, selectedItemId, selectedOutfitId, addSheetOpen } = useAtelier();
  const [splash, setSplash] = useState(true);
  const modal = !!selectedItemId || !!selectedOutfitId || addSheetOpen;

  useEffect(() => {
    const t = window.setTimeout(() => setSplash(false), 1500);
    return () => window.clearTimeout(t);
  }, []);

  // Reset scroll on screen change.
  useEffect(() => {
    document.getElementById("scroller")?.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <div className="relative flex h-full flex-col bg-obsidian text-ink">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(229,184,105,0.10),transparent_70%)]" />

      {/* Scroll region */}
      <main id="scroller" className="no-scrollbar relative flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {screen === "home" && <HomeScreen />}
            {screen === "wardrobe" && <WardrobeScreen />}
            {screen === "stylist" && <StylistScreen />}
            {screen === "looks" && <LooksScreen />}
            {screen === "profile" && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className={cn("absolute inset-x-0 bottom-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),14px)] transition-opacity", modal && "pointer-events-none opacity-0")}>
        <div className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 bg-gradient-to-t from-obsidian via-obsidian/85 to-transparent" />
        <div className="card relative flex items-center justify-between rounded-[26px] p-1.5 shadow-card">
          {NAV.map((n) => {
            const active = screen === n.key;
            return (
              <button key={n.key} onClick={() => setScreen(n.key)} className="press relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2">
                {active && <motion.span layoutId="navPill" className="absolute inset-0 rounded-2xl bg-champagne/10 ring-1 ring-champagne/25" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <n.icon size={18} className={cn("relative transition-colors", active ? "text-champagne" : "text-muted")} strokeWidth={active ? 2.2 : 1.8} />
                <span className={cn("relative text-[9.5px] font-semibold tracking-wide", active ? "text-champagne" : "text-muted")}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sheets */}
      <ItemDetailSheet />
      <OutfitDetailSheet />
      <AddItemSheet />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute inset-x-6 top-4 z-[60] rounded-2xl border border-champagne/30 bg-[#0d131c]/95 px-4 py-3 text-center text-[12px] font-medium text-ink shadow-gold backdrop-blur"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Splash & onboarding */}
      <AnimatePresence>
        {(splash || !ready) && (
          <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-obsidian">
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(229,184,105,0.12),transparent_70%)]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} className="relative text-center">
              <Monogram />
              <p className="mt-6 font-serif text-4xl italic tracking-tight text-ink">Atelier</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-champagne/80">Dressed with intent</p>
            </motion.div>
          </motion.div>
        )}
        {!splash && ready && !meta.onboarded && (
          <motion.div key="onboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.5 }} className="absolute inset-0 z-[65] flex flex-col bg-obsidian">
            <div className="relative flex-1">
              <img src={hero} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-obsidian/20 via-obsidian/40 to-obsidian" />
            </div>
            <div className="relative -mt-40 px-7 pb-10">
              <Monogram small />
              <h1 className="mt-5 font-serif text-[40px] leading-[1] text-ink">
                Your wardrobe,
                <br />
                <span className="gold-text italic">curated.</span>
              </h1>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                A 24-piece earth & jewel-tone capsule, 18 pre-styled looks, and a stylist engine tuned to an athletic build and warm skin.
              </p>
              <div className="mt-6 flex gap-2 text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="rounded-full border border-white/10 px-3 py-1.5">24 pieces</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">18 looks</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">Offline · private</span>
              </div>
              <GoldButton className="mt-7" onClick={() => updateMeta({ onboarded: true })}>
                Enter the Atelier
              </GoldButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Monogram({ small }: { small?: boolean }) {
  const s = small ? 44 : 72;
  return (
    <div className={cn("mx-auto flex items-center justify-center rounded-3xl border border-champagne/30 bg-champagne/[0.06]", small ? "mx-0" : "")} style={{ width: s, height: s }}>
      <svg viewBox="0 0 48 48" width={s * 0.6} height={s * 0.6}>
        <defs>
          <linearGradient id="mono" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3d9a4" />
            <stop offset="1" stopColor="#c9973f" />
          </linearGradient>
        </defs>
        <path d="M24 6 L40 42 H33.5 L29.6 32.5 H18.4 L14.5 42 H8 Z M20.4 27.5 H27.6 L24 18.5 Z" fill="url(#mono)" />
        <path d="M6 44 H42" stroke="url(#mono)" strokeWidth="1.2" opacity="0.6" />
      </svg>
    </div>
  );
}
