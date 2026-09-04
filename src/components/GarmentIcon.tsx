import type { WardrobeItem } from "../domain/types";
import { isLight } from "../domain/stylist";

type Kind = "shirt" | "polo" | "tee" | "tank" | "plaid" | "bomber" | "hoodie" | "track" | "trouser" | "jogger" | "court" | "runner";

export function kindOf(item: Pick<WardrobeItem, "subcategory" | "category">): Kind {
  const s = item.subcategory.toLowerCase();
  if (item.category === "SHOES") return s.includes("court") ? "court" : "runner";
  if (item.category === "BOTTOM") return s.includes("cargo") || s.includes("jogger") ? "jogger" : "trouser";
  if (s.includes("plaid") || s.includes("check")) return "plaid";
  if (s.includes("polo")) return "polo";
  if (s.includes("tank")) return "tank";
  if (s.includes("t-shirt") || s.includes("tee")) return "tee";
  if (s.includes("bomber")) return "bomber";
  if (s.includes("hoodie")) return "hoodie";
  if (s.includes("track")) return "track";
  return "shirt";
}

interface Props {
  item: Pick<WardrobeItem, "hex" | "hex2" | "subcategory" | "category" | "id">;
  className?: string;
}

/** Colour-accurate garment silhouettes, 100×100 viewBox. */
export function GarmentIcon({ item, className }: Props) {
  const kind = kindOf(item);
  const fill = item.hex;
  const light = isLight(fill);
  const line = light ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.28)";
  const shade = light ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.3)";
  const hi = light ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)";
  const gid = `g_${item.id}`;
  const accent = item.hex2 ?? (light ? "#0f1114" : "#e5b869");

  const Defs = (
    <defs>
      <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={light ? 0.35 : 0.16} />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.28" />
      </linearGradient>
      <pattern id={`${gid}_p`} width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill={fill} />
        <rect width="10" height="3" fill={accent} opacity="0.75" />
        <rect width="3" height="10" fill={accent} opacity="0.75" />
        <rect width="3" height="3" fill="#e9e4d8" opacity="0.5" />
      </pattern>
    </defs>
  );

  const topBody = "M36 22 L22 29 L14 54 L27 58 L27 92 L73 92 L73 58 L86 54 L78 29 L64 22 Q50 34 36 22 Z";
  const sleeveLines = (
    <>
      <path d="M27 58 L14 54" stroke={line} strokeWidth="1.2" />
      <path d="M73 58 L86 54" stroke={line} strokeWidth="1.2" />
    </>
  );

  const renderTop = (variant: Kind) => (
    <>
      <path d={topBody} fill={variant === "plaid" ? `url(#${gid}_p)` : fill} />
      <path d={topBody} fill={`url(#${gid})`} />
      {sleeveLines}
      {(variant === "shirt" || variant === "plaid") && (
        <>
          <path d="M36 22 L44 36 L50 30 L56 36 L64 22 L58 20 Q50 30 42 20 Z" fill={shade} />
          <path d="M36 22 L44 36 L50 30" fill="none" stroke={line} strokeWidth="1.2" />
          <path d="M64 22 L56 36 L50 30" fill="none" stroke={line} strokeWidth="1.2" />
          <path d="M50 32 V92" stroke={line} strokeWidth="1" />
          {[44, 54, 64, 74, 84].map((y) => (
            <circle key={y} cx="50" cy={y} r="1.3" fill={hi} />
          ))}
          <path d="M14 54 L20 34" stroke={hi} strokeWidth="0.8" opacity="0.5" />
        </>
      )}
      {variant === "polo" && (
        <>
          <path d="M38 22 L46 34 L50 29 L54 34 L62 22 L57 20 Q50 28 43 20 Z" fill={item.hex2 ?? shade} />
          <path d="M38 22 L46 34 L50 29 L54 34 L62 22" fill="none" stroke={line} strokeWidth="1.2" />
          <path d="M50 30 V48" stroke={line} strokeWidth="1" />
          <circle cx="50" cy="38" r="1.2" fill={hi} />
          <circle cx="50" cy="44" r="1.2" fill={hi} />
          {item.hex2 && (
            <>
              <path d="M27 57 L14 53" stroke={item.hex2} strokeWidth="2.6" />
              <path d="M73 57 L86 53" stroke={item.hex2} strokeWidth="2.6" />
            </>
          )}
        </>
      )}
      {variant === "tee" && (
        <>
          <path d="M40 22 Q50 32 60 22" fill="none" stroke={line} strokeWidth="2" />
          <path d="M40 22 Q50 32 60 22" fill="none" stroke={hi} strokeWidth="0.8" opacity="0.6" />
        </>
      )}
    </>
  );

  const renderTank = () => (
    <>
      <path d="M32 14 L38 14 Q50 30 62 14 L68 14 L72 40 Q66 50 68 92 L32 92 Q34 50 28 40 Z" fill={fill} />
      <path d="M32 14 L38 14 Q50 30 62 14 L68 14 L72 40 Q66 50 68 92 L32 92 Q34 50 28 40 Z" fill={`url(#${gid})`} />
      <path d="M38 14 Q50 30 62 14" fill="none" stroke={line} strokeWidth="1.4" />
    </>
  );

  const renderHoodie = () => (
    <>
      <path d="M36 24 L20 30 L12 56 L26 60 L26 92 L74 92 L74 60 L88 56 L80 30 L64 24 Z" fill={fill} />
      <path d="M36 24 L20 30 L12 56 L26 60 L26 92 L74 92 L74 60 L88 56 L80 30 L64 24 Z" fill={`url(#${gid})`} />
      <path d="M36 24 Q34 8 50 6 Q66 8 64 24 Q57 32 50 34 Q43 32 36 24 Z" fill={shade} />
      <path d="M36 24 Q34 8 50 6 Q66 8 64 24" fill="none" stroke={line} strokeWidth="1.3" />
      <path d="M42 30 Q50 40 58 30" fill="none" stroke={line} strokeWidth="1.2" />
      <path d="M46 34 V46 M54 34 V46" stroke={hi} strokeWidth="1" />
      <path d="M34 70 H66 V88 H34 Z" fill="none" stroke={line} strokeWidth="1.2" />
      <path d="M26 60 L12 56 M74 60 L88 56" stroke={line} strokeWidth="1.2" />
      <path d="M26 86 H74" stroke={line} strokeWidth="1" />
    </>
  );

  const renderJacket = (variant: "bomber" | "track") => (
    <>
      <path d="M34 22 L18 30 L10 58 L24 62 L24 92 L76 92 L76 62 L90 58 L82 30 L66 22 L58 20 L50 40 L42 20 Z" fill={fill} />
      <path d="M34 22 L18 30 L10 58 L24 62 L24 92 L76 92 L76 62 L90 58 L82 30 L66 22 L58 20 L50 40 L42 20 Z" fill={`url(#${gid})`} />
      <path d="M50 40 V92" stroke={line} strokeWidth="1.6" />
      <path d="M50 40 V92" stroke={hi} strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      <path d="M24 62 L10 58 M76 62 L90 58" stroke={line} strokeWidth="1.2" />
      <path d="M24 86 H76" stroke={line} strokeWidth="1.2" />
      {variant === "bomber" ? (
        <>
          <path d="M42 20 Q50 14 58 20 L50 40 Z" fill={shade} />
          <path d="M42 20 Q50 14 58 20" fill="none" stroke={line} strokeWidth="1.6" />
          <path d="M30 70 L40 72 M60 72 L70 70" stroke={line} strokeWidth="1.2" />
          {[26, 30, 34, 38, 42, 46, 54, 58, 62, 66, 70, 74].map((x) => (
            <path key={x} d={`M${x} 87 V92`} stroke={shade} strokeWidth="0.8" />
          ))}
        </>
      ) : (
        <>
          <path d="M42 20 L50 40 L58 20 L58 12 H42 Z" fill={shade} />
          <path d="M42 12 H58 V20" fill="none" stroke={line} strokeWidth="1.4" />
          <path d="M18 30 L10 58" stroke={accent} strokeWidth="2.2" opacity="0.9" />
          <path d="M82 30 L90 58" stroke={accent} strokeWidth="2.2" opacity="0.9" />
        </>
      )}
    </>
  );

  const renderTrouser = (variant: "trouser" | "jogger") => (
    <>
      <path d="M28 8 H72 L74 40 L70 94 H55 L50 48 L45 94 H30 L26 40 Z" fill={fill} />
      <path d="M28 8 H72 L74 40 L70 94 H55 L50 48 L45 94 H30 L26 40 Z" fill={`url(#${gid})`} />
      <path d="M28 14 H72" stroke={line} strokeWidth="1.2" />
      <path d="M50 22 V48" stroke={line} strokeWidth="1" />
      <path d="M32 14 L38 28 M68 14 L62 28" stroke={line} strokeWidth="1" />
      {variant === "jogger" ? (
        <>
          <path d="M30 60 H42 V74 H31 Z" fill="none" stroke={line} strokeWidth="1" />
          <path d="M58 60 H70 V74 H59 Z" fill="none" stroke={line} strokeWidth="1" />
          <path d="M31 88 H45 M55 88 H69" stroke={line} strokeWidth="1.4" />
          <path d="M44 14 Q50 20 56 14" fill="none" stroke={hi} strokeWidth="1" />
        </>
      ) : (
        <>
          <path d="M28 8 H72" stroke={hi} strokeWidth="1" opacity="0.6" />
          <circle cx="50" cy="18" r="1.4" fill={hi} />
          <path d="M37 60 V90 M63 60 V90" stroke={shade} strokeWidth="0.8" />
        </>
      )}
    </>
  );

  const renderShoe = (variant: "court" | "runner") => (
    <>
      <path d="M6 66 Q6 58 16 56 L38 44 Q46 40 54 46 L84 58 Q94 62 94 70 L94 74 H6 Z" fill={fill} />
      <path d="M6 66 Q6 58 16 56 L38 44 Q46 40 54 46 L84 58 Q94 62 94 70 L94 74 H6 Z" fill={`url(#${gid})`} />
      <path d="M6 74 H94 L94 80 Q94 84 90 84 H10 Q6 84 6 80 Z" fill={variant === "court" ? "#f1ede4" : "#e9e4d8"} />
      <path d="M6 74 H94" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
      <path d="M38 44 L48 64" stroke={line} strokeWidth="1" />
      {variant === "court" ? (
        <>
          <path d="M50 50 L82 62" stroke={accent} strokeWidth="2.2" />
          <path d="M40 46 Q56 52 66 58" fill="none" stroke={line} strokeWidth="0.8" />
          {[44, 50, 56].map((x, i) => (
            <path key={x} d={`M${x} ${48 + i * 3} L${x + 6} ${46 + i * 3}`} stroke={hi} strokeWidth="1.2" />
          ))}
          <path d="M6 66 Q6 58 16 56 L20 74" fill={hi} opacity="0.3" />
        </>
      ) : (
        <>
          <path d="M6 74 H94 L94 80 Q94 84 90 84 H10 Q6 84 6 80 Z" fill={accent} opacity="0.85" />
          <path d="M20 74 Q50 70 94 74" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
          <path d="M54 46 Q62 56 74 60" fill="none" stroke={accent} strokeWidth="1.6" />
          {[42, 48, 54].map((x, i) => (
            <path key={x} d={`M${x} ${47 + i * 3} L${x + 6} ${45 + i * 3}`} stroke={hi} strokeWidth="1.2" />
          ))}
          <path d="M16 56 L22 70" stroke={hi} strokeWidth="1" opacity="0.5" />
        </>
      )}
    </>
  );

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {Defs}
      {(kind === "shirt" || kind === "polo" || kind === "tee" || kind === "plaid") && renderTop(kind)}
      {kind === "tank" && renderTank()}
      {kind === "hoodie" && renderHoodie()}
      {(kind === "bomber" || kind === "track") && renderJacket(kind)}
      {(kind === "trouser" || kind === "jogger") && renderTrouser(kind)}
      {(kind === "court" || kind === "runner") && renderShoe(kind)}
    </svg>
  );
}
