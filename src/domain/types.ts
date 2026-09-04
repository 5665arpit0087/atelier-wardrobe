export type Category = "TOP" | "LAYER" | "BOTTOM" | "SHOES";
export type Occasion = "DATE" | "SMART_CASUAL" | "DAILY_CASUAL" | "ATHLEISURE";
export type Weather = "HOT" | "PLEASANT" | "COOL";
export type Tone = "warm" | "cool" | "neutral";

export interface WardrobeItem {
  id: string;
  name: string;
  brand: string;
  category: Category;
  subcategory: string;
  color: string;
  /** primary swatch hex */
  hex: string;
  /** optional secondary swatch hex (for two-tone garments) */
  hex2?: string;
  tone: Tone;
  /** how well the piece works in a given weather 0..1 */
  weather: Record<Weather, number>;
  /** occasions the piece is suitable for */
  occasions: Occasion[];
  /** local image (data url) stored in the internal image store */
  imageId?: string;
  /** bundled static photo (public/images/…) shown when no user photo attached */
  photo?: string;
  favorite: boolean;
  wearCount: number;
  lastWorn?: number;
  createdAt: number;
  custom?: boolean;
}

export interface Outfit {
  id: string;
  title: string;
  occ: Occasion;
  weather: Weather;
  topId: string;
  layerId?: string;
  bottomId: string;
  shoeId: string;
  styleTip: string;
  favorite: boolean;
  wearCount: number;
  lastWorn?: number;
  createdAt: number;
  custom?: boolean;
}

export interface ResolvedOutfit extends Outfit {
  top: WardrobeItem;
  layer?: WardrobeItem;
  bottom: WardrobeItem;
  shoe: WardrobeItem;
}

export const OCCASIONS: { key: Occasion; label: string; short: string; blurb: string }[] = [
  { key: "DATE", label: "Date Night", short: "Date", blurb: "Intense, striking, close-cut." },
  { key: "SMART_CASUAL", label: "Smart Casual", short: "Smart", blurb: "Refined, warm, old-money ease." },
  { key: "DAILY_CASUAL", label: "Daily Casual", short: "Daily", blurb: "Understated athletic uniform." },
  { key: "ATHLEISURE", label: "Athleisure", short: "Active", blurb: "Performance, stretch, motion." },
];

export const WEATHERS: { key: Weather; label: string; temp: string }[] = [
  { key: "HOT", label: "Hot", temp: "28°+" },
  { key: "PLEASANT", label: "Pleasant", temp: "18–27°" },
  { key: "COOL", label: "Cool", temp: "< 18°" },
];

export const CATEGORIES: { key: Category; label: string; plural: string }[] = [
  { key: "TOP", label: "Top", plural: "Tops" },
  { key: "LAYER", label: "Layer", plural: "Layers" },
  { key: "BOTTOM", label: "Bottom", plural: "Bottoms" },
  { key: "SHOES", label: "Shoes", plural: "Footwear" },
];

export const occasionLabel = (o: Occasion) => OCCASIONS.find((x) => x.key === o)?.label ?? o;
export const weatherLabel = (w: Weather) => WEATHERS.find((x) => x.key === w)?.label ?? w;
