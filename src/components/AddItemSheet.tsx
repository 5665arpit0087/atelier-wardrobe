import { Camera, Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GarmentIcon } from "./GarmentIcon";
import { Chip, GoldButton, Sheet } from "./ui";
import { CATEGORIES, OCCASIONS, type Category, type Occasion, type Tone, type Weather } from "../domain/types";
import { hexToHsl } from "../domain/stylist";
import { useAtelier } from "../store/AtelierStore";
import { formatBytes } from "../utils/image";

const SUBS: Record<Category, string[]> = {
  TOP: ["Shirt", "Plaid Shirt", "Polo", "T-Shirt", "Tank Top", "Overshirt", "Knit"],
  LAYER: ["Bomber", "Hoodie", "Track Jacket", "Blazer", "Denim Jacket", "Cardigan"],
  BOTTOM: ["Jeans", "Chinos", "Cargos", "Trousers", "Shorts"],
  SHOES: ["Court Sneakers", "Slip-on Runners", "Athletic Shoes", "Loafers", "Boots"],
};

const PALETTE = [
  ["#1f4d3a", "Forest Green"], ["#5c1f2e", "Wine Maroon"], ["#8f6b78", "Dusty Mauve"], ["#b4532a", "Burnt Orange"],
  ["#5b6a3a", "Olive Green"], ["#12656b", "Deep Teal"], ["#b0824f", "Camel Brown"], ["#c8b28d", "Warm Khaki"],
  ["#3a3f47", "Charcoal Grey"], ["#0f1114", "Jet Black"], ["#4a6a94", "Medium Blue"], ["#1b2a44", "Navy"],
  ["#7a8a6a", "Sage Green"], ["#e9e4d8", "Off-White"], ["#8b8f96", "Heather Grey"], ["#6b3f2a", "Chocolate"],
  ["#c9a24d", "Mustard"], ["#7a2f3f", "Burgundy"], ["#2f4858", "Slate Blue"], ["#d9c7a7", "Sand"],
];

const guessTone = (hex: string): Tone => {
  const { h, s } = hexToHsl(hex);
  if (s < 0.15) return "neutral";
  return (h >= 0 && h < 75) || h > 330 ? "warm" : "cool";
};

export function AddItemSheet() {
  const { addSheetOpen, setAddSheetOpen, addItem } = useAtelier();
  const [category, setCategory] = useState<Category>("TOP");
  const [subcategory, setSubcategory] = useState("Shirt");
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#1f4d3a");
  const [color, setColor] = useState("Forest Green");
  const [occ, setOcc] = useState<Occasion[]>(["SMART_CASUAL", "DAILY_CASUAL"]);
  const [weather, setWeather] = useState<Record<Weather, number>>({ HOT: 0.7, PLEASANT: 1, COOL: 0.7 });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setSubcategory(SUBS[category][0]), [category]);
  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const tone = useMemo(() => guessTone(hex), [hex]);
  const previewItem = { id: "preview", hex, subcategory, category };
  const canSave = name.trim().length > 1 && occ.length > 0;

  const resetForm = () => {
    setBrand(""); setName(""); setFile(null); setDone(null); setOcc(["SMART_CASUAL", "DAILY_CASUAL"]);
  };

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    const result = await addItem({
      name: brand.trim() ? `${brand.trim()} ${name.trim()}` : name.trim(),
      brand: brand.trim() || "Personal",
      category, subcategory, color, hex, tone, occasions: occ, weather, file: file ?? undefined,
    });
    setBusy(false);
    setDone(result ? `Photo stored at ${formatBytes(result.bytes)} (${result.width}×${result.height}, ${result.format.split("/")[1]})` : "Added to your capsule");
    window.setTimeout(() => { setAddSheetOpen(false); resetForm(); }, 1100);
  };

  return (
    <Sheet open={addSheetOpen} onClose={() => { setAddSheetOpen(false); resetForm(); }} title="Add a piece" full>
      <div className="space-y-5 px-5 pb-10">
        {/* Preview + photo */}
        <div className="flex gap-3">
          <div
            className="relative flex h-32 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08]"
            style={{ background: `radial-gradient(120% 90% at 30% 15%, ${hex}55 0%, #0a0e15 100%)` }}
          >
            {preview ? <img src={preview} className="h-full w-full object-cover" alt="" /> : <GarmentIcon item={previewItem} className="h-[76%] w-[76%] drop-shadow-2xl" />}
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <p className="text-[13px] font-semibold text-ink">Garment photo</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">Resized to ≤720px, WebP, ~50 KB — light on storage, quick to load.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileRef.current?.click()} className="press flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-ink">
              <Camera size={14} /> {file ? "Change photo" : "Camera or gallery"}
            </button>
          </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-3 gap-2">
          <Field label="Brand" value={brand} onChange={setBrand} placeholder="Snitch" />
          <div className="col-span-2">
            <Field label="Piece name" value={name} onChange={setName} placeholder="Forest Green Shirt" />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => setCategory(c.key)} className={`press rounded-xl border py-2.5 text-xs font-semibold transition ${category === c.key ? "border-champagne/60 bg-champagne text-obsidian" : "border-white/[0.08] bg-white/[0.03] text-muted"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {SUBS[category].map((s) => (
              <Chip key={s} tone="emerald" active={subcategory === s} onClick={() => setSubcategory(s)}>{s}</Chip>
            ))}
          </div>
        </div>

        {/* Colour */}
        <div>
          <div className="flex items-center justify-between">
            <Label>Colour · {color}</Label>
            <span className="text-[10px] uppercase tracking-wider text-muted">{tone} tone</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {PALETTE.map(([h, n]) => (
              <button key={h} onClick={() => { setHex(h); setColor(n); }} className="press relative aspect-square rounded-lg ring-1 ring-white/10" style={{ background: h }} aria-label={n}>
                {hex === h && <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-muted">
              Custom <input type="color" value={hex} onChange={(e) => { setHex(e.target.value); setColor("Custom"); }} className="h-5 w-8 cursor-pointer rounded border-0 bg-transparent" />
            </label>
            <input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-ink outline-none focus:border-champagne/40" placeholder="Colour name" />
          </div>
        </div>

        {/* Occasions */}
        <div>
          <Label>Occasions</Label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <Chip key={o.key} active={occ.includes(o.key)} onClick={() => setOcc((p) => (p.includes(o.key) ? p.filter((x) => x !== o.key) : [...p, o.key]))}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div>
          <Label>Weather suitability</Label>
          <div className="card space-y-3 rounded-2xl p-4">
            {(["HOT", "PLEASANT", "COOL"] as Weather[]).map((w) => (
              <div key={w} className="flex items-center gap-3 text-[11px]">
                <span className="w-16 capitalize text-ink">{w.toLowerCase()}</span>
                <input type="range" min={0} max={1} step={0.1} value={weather[w]} onChange={(e) => setWeather((p) => ({ ...p, [w]: Number(e.target.value) }))} className="flex-1" />
                <span className="w-8 text-right text-muted">{Math.round(weather[w] * 100)}</span>
              </div>
            ))}
          </div>
        </div>

        <GoldButton onClick={submit} disabled={!canSave || busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : done ? <Check size={16} /> : <Sparkles size={16} />}
          {busy ? "Compressing & saving…" : done ? done : "Add to wardrobe"}
        </GoldButton>
      </div>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{children}</p>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-muted/50 focus:border-champagne/40" />
    </label>
  );
}
