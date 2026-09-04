import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { OutfitCard } from "../components/OutfitCards";
import { Chip, Empty } from "../components/ui";
import { OCCASIONS, WEATHERS, type Occasion, type Weather } from "../domain/types";
import { useAtelier } from "../store/AtelierStore";

export function LooksScreen() {
  const { resolved, weatherNow } = useAtelier();
  const [occ, setOcc] = useState<Occasion | "ALL">("ALL");
  const [weather, setWeather] = useState<Weather | "ALL">("ALL");
  const [fav, setFav] = useState(false);

  const list = useMemo(() => {
    let l = resolved;
    if (occ !== "ALL") l = l.filter((o) => o.occ === occ);
    if (weather !== "ALL") l = l.filter((o) => o.weather === weather);
    if (fav) l = l.filter((o) => o.favorite);
    // Looks for the current weather float up; custom saved looks first.
    return [...l].sort((a, b) => Number(!!b.custom) - Number(!!a.custom) || Number(b.weather === weatherNow) - Number(a.weather === weatherNow));
  }, [resolved, occ, weather, fav, weatherNow]);

  return (
    <div className="safe-bottom">
      <header className="px-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">Curated · {resolved.length} looks</p>
        <h1 className="mt-1 font-serif text-[30px] leading-none text-ink">Lookbook</h1>
      </header>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5">
        <Chip active={occ === "ALL"} onClick={() => setOcc("ALL")}>All</Chip>
        {OCCASIONS.map((o) => (
          <Chip key={o.key} active={occ === o.key} onClick={() => setOcc(o.key)}>{o.label}</Chip>
        ))}
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-5">
        <Chip tone="emerald" active={weather === "ALL"} onClick={() => setWeather("ALL")}>Any weather</Chip>
        {WEATHERS.map((w) => (
          <Chip tone="emerald" key={w.key} active={weather === w.key} onClick={() => setWeather(w.key)}>{w.label}</Chip>
        ))}
        <Chip tone="emerald" active={fav} onClick={() => setFav((v) => !v)}>
          <span className="flex items-center gap-1"><Heart size={11} className={fav ? "fill-obsidian" : ""} /> Loved</span>
        </Chip>
      </div>

      <div className="mt-5 space-y-3 px-5">
        {list.map((o, i) => (
          <OutfitCard key={o.id} o={o} index={i} />
        ))}
      </div>
      {list.length === 0 && (
        <div className="mt-4">
          <Empty title="No looks match" body="Loosen the filters or ask the Stylist to compose something new for this combination." />
        </div>
      )}
    </div>
  );
}
