import { Camera, Heart, ImageOff, Loader2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { OCCASIONS, WEATHERS, occasionLabel } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { formatBytes, type CompressedImage } from "../utils/image";
import { ItemVisual } from "./ItemVisual";
import { GhostButton, Sheet, Tag } from "./ui";
import { OutfitRailCard } from "./OutfitCards";

export function ItemDetailSheet() {
  const { selectedItemId, openItem, items, resolved, toggleItemFavorite, attachImage, removeImage, deleteItem, notify } = useAtelier();
  const item = items.find((i) => i.id === selectedItemId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<CompressedImage | null>(null);
  const [confirm, setConfirm] = useState(false);

  const usedIn = useMemo(() => (item ? resolved.filter((o) => [o.topId, o.layerId, o.bottomId, o.shoeId].includes(item.id)) : []), [resolved, item]);

  const onFile = async (f?: File) => {
    if (!f || !item) return;
    setBusy(true);
    try {
      const r = await attachImage(item.id, f);
      setLast(r);
      notify(`Photo compressed ${formatBytes(r.originalBytes)} → ${formatBytes(r.bytes)}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Couldn't process that image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={!!item} onClose={() => { openItem(null); setConfirm(false); setLast(null); }} full>
      {item && (
        <div className="pb-10">
          <div className="relative mx-4 overflow-hidden rounded-[26px]">
            <ItemVisual item={item} className="aspect-[4/4.4] w-full" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d131c] via-[#0d131c]/60 to-transparent p-5 pt-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne">{item.brand}</p>
              <h2 className="mt-1 font-serif text-[26px] leading-tight text-ink">{item.name.replace(`${item.brand} `, "")}</h2>
            </div>
            <button
              onClick={() => toggleItemFavorite(item.id)}
              aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={item.favorite}
              className="press absolute right-4 top-4 rounded-full border border-white/10 bg-black/40 p-2.5 backdrop-blur"
            >
              <Heart size={18} aria-hidden="true" className={item.favorite ? "fill-rose-a text-rose-a" : "text-ink"} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 px-5">
            <Tag tone="gold">{item.category}</Tag>
            <Tag>{item.subcategory}</Tag>
            <Tag>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.hex }} /> {item.color}
            </Tag>
            <Tag tone={item.tone === "warm" ? "gold" : item.tone === "cool" ? "emerald" : "muted"}>{item.tone} tone</Tag>
          </div>

          {/* Photo actions */}
          <div className="mt-5 px-5">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="card rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Garment photo</p>
                  <p className="text-[11px] text-muted">{item.imageId ? "Stored locally, compressed" : "Add a photo from camera or gallery"}</p>
                </div>
                <div className="flex gap-2">
                  {item.imageId && (
                    <button onClick={() => removeImage(item.id)} aria-label="Remove garment photo" className="press rounded-xl border border-white/10 p-2.5 text-muted hover:text-rose-a">
                      <ImageOff size={16} aria-hidden="true" />
                    </button>
                  )}
                  <button onClick={() => fileRef.current?.click()} disabled={busy} aria-label={item.imageId ? "Replace garment photo" : "Add garment photo"} className="press flex items-center gap-1.5 rounded-xl gold-fill px-3.5 py-2.5 text-xs font-bold text-obsidian disabled:opacity-60">
                    {busy ? <Loader2 size={14} aria-hidden="true" className="animate-spin" /> : <Camera size={14} aria-hidden="true" />} {item.imageId ? "Replace" : "Add photo"}
                  </button>
                </div>
              </div>
              {last && (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t hairline pt-3 text-center">
                  <Mini k="Original" v={formatBytes(last.originalBytes)} />
                  <Mini k="Stored" v={formatBytes(last.bytes)} accent />
                  <Mini k="Size" v={`${last.width}×${last.height}`} />
                </div>
              )}
            </div>
          </div>

          {/* Suitability */}
          <div className="mt-4 grid grid-cols-2 gap-2 px-5">
            <div className="card rounded-2xl p-4">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted">Weather</p>
              <div className="mt-2 space-y-1.5">
                {WEATHERS.map((w) => (
                  <div key={w.key} className="flex items-center gap-2 text-[11px]">
                    <span className="w-14 text-ink">{w.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-emerald-a" style={{ width: `${item.weather[w.key] * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card rounded-2xl p-4">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted">Occasions</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {OCCASIONS.map((o) => (
                  <span key={o.key} className={`rounded-full border px-2 py-0.5 text-[9.5px] font-semibold ${item.occasions.includes(o.key) ? "border-champagne/40 bg-champagne/10 text-champagne" : "border-white/[0.06] text-muted/50"}`}>
                    {occasionLabel(o.key)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-muted">Worn</p>
              <p className="font-serif text-xl text-ink">{item.wearCount}×</p>
            </div>
          </div>

          {/* Used in */}
          {usedIn.length > 0 && (
            <div className="mt-6">
              <p className="px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Styled in {usedIn.length} look{usedIn.length > 1 ? "s" : ""}</p>
              <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5">
                {usedIn.map((o) => (
                  <OutfitRailCard key={o.id} o={o} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 px-5">
            {!confirm ? (
              <GhostButton danger onClick={() => setConfirm(true)} className="w-full">
                <Trash2 size={15} /> Remove from wardrobe
              </GhostButton>
            ) : (
              <div className="card rounded-2xl border-rose-a/30 p-4">
                <p className="text-[12.5px] text-ink">Remove this piece? {usedIn.length > 0 && `${usedIn.length} look(s) using it will also be removed.`}</p>
                <div className="mt-3 flex gap-2">
                  <GhostButton onClick={() => setConfirm(false)} className="flex-1">Keep</GhostButton>
                  <GhostButton danger onClick={() => deleteItem(item.id)} className="flex-1">Remove</GhostButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Mini({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-muted">{k}</p>
      <p className={`text-[12px] font-semibold ${accent ? "text-emerald-a" : "text-ink"}`}>{v}</p>
    </div>
  );
}
