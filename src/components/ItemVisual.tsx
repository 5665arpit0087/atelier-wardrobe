import type { WardrobeItem } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";
import { GarmentIcon } from "./GarmentIcon";
import { cn } from "../utils/cn";
import { hexToHsl } from "../domain/stylist";
import { useState } from "react";

interface Props {
  item: WardrobeItem;
  className?: string;
  iconClassName?: string;
  /** render the swatch background */
  bg?: boolean;
}

/**
 * Photo priority: user upload → bundled file `images/wardrobe/<id>.jpg`
 * (or explicit `photo` override) → tinted silhouette. Missing bundled
 * files fail silently back to the silhouette via onError.
 */
export function ItemVisual({ item, className, iconClassName, bg = true }: Props) {
  const { imageUrls } = useAtelier();
  const [missing, setMissing] = useState<string | null>(null);
  const uploaded = item.imageId ? imageUrls[item.imageId] : undefined;
  const file = item.photo ?? `${item.id}.jpg`;
  const bundled = `${import.meta.env.BASE_URL}images/wardrobe/${file}`;
  const missKey = `${item.id}|${file}`;
  const url = uploaded ?? (missing === missKey ? undefined : bundled);
  const { h, s } = hexToHsl(item.hex);
  const tint = `hsl(${h} ${Math.round(s * 100 * 0.6)}% 12%)`;
  const tint2 = `hsl(${h} ${Math.round(s * 100 * 0.5)}% 7%)`;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={bg ? { background: `radial-gradient(120% 90% at 30% 15%, ${tint} 0%, ${tint2} 60%, #0a0e15 100%)` } : undefined}
    >
      {bg && <div className="fabric absolute inset-0 opacity-70" />}
      {url ? (
        <img src={url} alt={item.name} onError={() => setMissing(missKey)} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute h-1/2 w-1/2 rounded-full blur-2xl opacity-40"
            style={{ background: item.hex }}
          />
          <GarmentIcon item={item} className={cn("relative h-[72%] w-[72%] drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]", iconClassName)} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.03]" />
    </div>
  );
}
