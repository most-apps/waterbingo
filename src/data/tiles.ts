export interface Tile {
  id: string;
  /** Full name, shown big on the caller screen. */
  label: string;
  /** Fits a small card square; defaults to `label`. */
  short: string;
  image: string;
}

const images = import.meta.glob<string>("../assets/tiles/*.png", {
  eager: true,
  import: "default",
});

function imageFor(id: string): string {
  const url = images[`../assets/tiles/${id}.png`];
  if (!url) throw new Error(`Missing tile image: src/assets/tiles/${id}.png`);
  return url;
}

/**
 * Every tile that can be called and printed on a card.
 *
 * ORDER MATTERS: card layouts are derived from this list (see lib/cards.ts).
 * Reordering, removing, or inserting entries changes every printed card, so
 * existing printed cards would no longer match the checker. Append new tiles
 * at the end and reprint cards whenever this list changes.
 */
const TILE_LABELS: ReadonlyArray<readonly [id: string, label: string, short?: string]> = [
  ["food-scraps", "Food Scraps"],
  ["poop", "Poop"],
  ["screen", "Screen"],
  ["grit", "Grit"],
  ["pee", "Pee"],
  ["dental-floss", "Dental Floss"],
  ["soap", "Soap"],
  ["brewerton-plant", "Brewerton Treatment Plant", "Brewerton Plant"],
  ["wipes", "Wipes"],
  ["oak-orchard-plant", "Oak Orchard Treatment Plant", "Oak Orchard Plant"],
  ["irongate-pump-station", "Irongate Pump Station"],
  ["secondary-clarifiers", "Secondary Clarifiers (Microorganisms)", "Secondary Clarifiers"],
  ["storm-drain", "Storm Drain"],
  ["baldwinsville-seneca-knolls-plant", "Baldwinsville-Seneca Knolls Treatment Plant", "Baldwinsville Plant"],
  ["benedict-road-pump-station", "Benedict Road Pump Station", "Benedict Rd Pump Station"],
  ["toilet-paper", "Toilet Paper"],
  ["meadowbrook-limestone-plant", "Meadowbrook-Limestone Treatment Plant", "Meadowbrook Plant"],
  ["uv-light", "Nutrient Removal (UV Light)", "UV Light"],
  ["pump-station", "Pump Station"],
  ["wetzel-road-plant", "Wetzel Road Treatment Plant", "Wetzel Road Plant"],
  ["wep-logo", "Water Environment Protection", "WEP"],
  ["primary-clarifiers", "Primary Clarifiers"],
  ["hair", "Hair"],
  ["outfall", "Outfall"],
  ["wastewater-plant", "Wastewater Treatment Plant", "Wastewater Plant"],
  ["aeration-tank", "Aeration Tank"],
  ["cotton-ball", "Cotton Balls"],
];

export const TILES: readonly Tile[] = TILE_LABELS.map(([id, label, short]) => ({
  id,
  label,
  short: short ?? label,
  image: imageFor(id),
}));

export const TILE_IDS: readonly string[] = TILES.map((t) => t.id);

const byId = new Map(TILES.map((t) => [t.id, t]));

export function getTile(id: string): Tile {
  const tile = byId.get(id);
  if (!tile) throw new Error(`Unknown tile id: ${id}`);
  return tile;
}

