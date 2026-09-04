import { motion } from "framer-motion";
import { Database, Download, HardDrive, Image as ImageIcon, RotateCcw, Ruler, Sparkles, Sun, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GhostButton } from "../components/ui";
import { getAllImages } from "../data/imageStore";
import { saveItems, saveMeta, saveOutfits } from "../data/repository";
import { CATEGORIES } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { formatBytes } from "../utils/image";

const guide = [
  { title: "Broad shoulders", body: "V-necks, open collars and slim-through-body cuts. Avoid heavy shoulder detail — the frame already speaks.", icon: Ruler },
  { title: "Defined jawline", body: "Polo collars and framed necklines (black-tipped collars) sharpen the line below the jaw.", icon: Sparkles },
  { title: "Warm / tan skin", body: "Earth tones (camel, rust, olive, khaki) harmonise; jewel tones (forest, teal, wine) create glow by contrast.", icon: Sun },
];

export function ProfileScreen() {
  const { items, outfits, meta, updateMeta, reset, imageUrls, notify } = useAtelier();
  const [storage, setStorage] = useState<{ count: number; bytes: number }>({ count: 0, bytes: 0 });
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState(meta.name);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(meta.name), [meta.name]);
  useEffect(() => {
    getAllImages().then((m) => {
      const blobs = Object.values(m);
      setStorage({ count: blobs.length, bytes: blobs.reduce((a, b) => a + b.size, 0) });
    }).catch(() => {});
  }, [imageUrls]);

  const mostWorn = useMemo(() => [...items].sort((a, b) => b.wearCount - a.wearCount).slice(0, 3).filter((i) => i.wearCount > 0), [items]);
  const dbBytes = useMemo(() => new Blob([JSON.stringify(items), JSON.stringify(outfits)]).size, [items, outfits]);

  const exportBackup = () => {
    try {
      const payload = {
        app: "atelier-wardrobe",
        version: 1,
        exportedAt: new Date().toISOString(),
        items,
        outfits,
        meta,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atelier-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      notify("Backup downloaded — keep it somewhere safe");
    } catch {
      notify("Couldn't create backup");
    }
  };

  const importBackup = async (f?: File) => {
    if (!f) return;
    try {
      const raw = await f.text();
      const data = JSON.parse(raw) as { items?: unknown; outfits?: unknown; meta?: unknown };
      if (!Array.isArray(data.items) || !Array.isArray(data.outfits) || typeof data.meta !== "object" || !data.meta) {
        notify("That file doesn't look like an Atelier backup");
        return;
      }
      // Minimal shape check before overwriting.
      const itemsOk = (data.items as unknown[]).every((i) => typeof i === "object" && i !== null && "id" in i && "category" in i);
      const outfitsOk = (data.outfits as unknown[]).every((o) => typeof o === "object" && o !== null && "id" in o && "topId" in o);
      if (!itemsOk || !outfitsOk) {
        notify("Backup file is invalid — nothing was changed");
        return;
      }
      saveItems(data.items as typeof items);
      saveOutfits(data.outfits as typeof outfits);
      saveMeta({ ...(meta as object), ...(data.meta as object) } as typeof meta);
      notify("Backup restored — reloading");
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      notify("Couldn't read that backup file");
    }
  };

  return (
    <div className="safe-bottom">
      <header className="px-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Client Profile</p>
        <h1 className="mt-1 font-serif text-[30px] leading-none text-ink">Atelier Card</h1>
      </header>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card grain relative mx-5 mt-5 overflow-hidden rounded-[28px] p-5 shadow-card">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-champagne/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-a/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gold-fill font-serif text-2xl font-semibold text-obsidian shadow-gold">
            {name.trim().charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={name}
              aria-label="Display name"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => updateMeta({ name: name.trim() || "Atelier Client" })}
              className="w-full bg-transparent font-serif text-[22px] text-ink outline-none"
            />
            <p className="text-[11px] text-muted">Member since {new Date(meta.seededAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted">Build</p>
            <p className="mt-1 text-[12.5px] font-medium text-ink">{meta.build}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted">Skin tone</p>
            <p className="mt-1 flex items-center gap-2 text-[12.5px] font-medium text-ink">
              <span className="h-3 w-3 rounded-full bg-[#c68b59] ring-1 ring-white/20" />
              {meta.skinTone}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Style guide */}
      <section className="mt-7 px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Stylist's notes</p>
        <h2 className="mt-1 font-serif text-[22px] text-ink">Fit & Colour Principles</h2>
        <div className="mt-3 space-y-2">
          {guide.map((g, i) => (
            <motion.div key={g.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="card flex gap-3 rounded-2xl p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-champagne/10 text-champagne ring-1 ring-champagne/20">
                <g.icon size={16} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink">{g.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{g.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Composition */}
      <section className="mt-7 px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Capsule composition</p>
        <div className="card mt-3 rounded-2xl p-4">
          {CATEGORIES.map((c) => {
            const n = items.filter((i) => i.category === c.key).length;
            const pct = items.length ? (n / items.length) * 100 : 0;
            return (
              <div key={c.key} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink">{c.plural}</span>
                  <span className="text-muted">{n}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full gold-fill" />
                </div>
              </div>
            );
          })}
          {mostWorn.length > 0 && (
            <div className="mt-4 border-t hairline pt-3">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted">Most worn</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mostWorn.map((i) => (
                  <span key={i.id} className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2.5 text-[10.5px] text-ink">
                    <span className="h-4 w-4 rounded-full" style={{ background: i.hex }} /> {i.subcategory} · {i.wearCount}×
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Storage */}
      <section className="mt-7 px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Storage & data</p>
        <div className="card mt-3 divide-y divide-white/[0.06] rounded-2xl">
          <Row icon={Database} label="Local database" value={`${items.length} items · ${outfits.length} looks · ${formatBytes(dbBytes)}`} />
          <Row icon={ImageIcon} label="Wardrobe images" value={`${storage.count} photos · ${formatBytes(storage.bytes)}`} />
          <Row icon={HardDrive} label="Compression pipeline" value="≤ 720px · WebP · ~50 KB target" tone="emerald" />
        </div>
        <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void importBackup(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <GhostButton onClick={exportBackup} className="w-full">
            <Download size={15} /> Export backup
          </GhostButton>
          <GhostButton onClick={() => importRef.current?.click()} className="w-full">
            <Upload size={15} /> Import backup
          </GhostButton>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">Backups include pieces, looks and profile. Photos stay on this device (IndexedDB) and are not part of the file.</p>
      </section>

      <section className="mt-6 px-5">
        {!confirm ? (
          <GhostButton onClick={() => setConfirm(true)} className="w-full">
            <RotateCcw size={15} /> Restore original capsule
          </GhostButton>
        ) : (
          <div className="card rounded-2xl border-rose-a/30 p-4">
            <p className="text-[13px] font-semibold text-ink">Reset the wardrobe?</p>
            <p className="mt-1 text-[11.5px] text-muted">Custom pieces, saved looks and wear history will be removed. The 24-piece capsule and 18 curated looks will be re-seeded.</p>
            <div className="mt-3 flex gap-2">
              <GhostButton onClick={() => setConfirm(false)} className="flex-1">Keep</GhostButton>
              <GhostButton danger onClick={() => { reset(); setConfirm(false); }} className="flex-1">
                <Trash2 size={14} /> Reset
              </GhostButton>
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.22em] text-muted/60">Atelier · v1.0 · Crafted for one</p>
      </section>
    </div>
  );
}

function Row({ icon: Icon, label, value, tone }: { icon: typeof Database; label: string; value: string; tone?: "emerald" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={15} className={tone === "emerald" ? "text-emerald-a" : "text-champagne/80"} />
      <div className="min-w-0">
        <p className="text-[12.5px] text-ink">{label}</p>
        <p className="truncate text-[10.5px] text-muted">{value}</p>
      </div>
    </div>
  );
}
