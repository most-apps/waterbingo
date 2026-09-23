/**
 * Card IDs are two adjectives and a water noun, e.g. "bubbly-misty-otter", picked
 * at random when cards are printed. Unlike sequential numbers, separate print runs
 * (and leftover cards from past events) are vanishingly unlikely to share an ID.
 *
 * A card's pictures are seeded from its ID string (see `cardLayout`), so words can
 * be added to these lists freely, but renaming or removing one breaks every printed
 * card that uses it. Words stay short so the longest ID fits the card footer (tested
 * in cardsPdf.test.ts) and the two lists never share a word.
 */
export const ADJECTIVES: readonly string[] = [
  "aqua", "azure", "balmy", "blue", "bold", "bouncy", "brave", "breezy", "bright", "bubbly", "calm", "cheery",
  "chilly", "clear", "clever", "cloudy", "cobalt", "cool", "cozy", "crisp", "curious", "dapper", "daring", "deep",
  "dewy", "dizzy", "dreamy", "drippy", "drizzly", "eager", "fancy", "fizzy", "flashy", "fluffy", "foamy", "foggy",
  "fresh", "friendly", "frisky", "frosty", "frothy", "frozen", "funky", "gentle", "giant", "giggly", "glassy",
  "gleeful", "glossy", "glowing", "golden", "grassy", "groovy", "happy", "hazy", "icy", "jazzy", "jolly", "jumpy",
  "kind", "leafy", "lively", "lofty", "lucky", "mellow", "melty", "merry", "mighty", "misty", "moonlit", "mossy",
  "muddy", "nifty", "nimble", "noble", "pearly", "pebbly", "peppy", "perky", "playful", "plucky", "proud", "quick",
  "quiet", "quirky", "rainy", "rapid", "rosy", "salty", "sandy", "sassy", "shiny", "silly", "silver", "sleek",
  "sleepy", "sloshy", "smooth", "snappy", "snowy", "snug", "soggy", "sparkly", "speedy", "spiffy", "splashy", "spry",
  "spunky", "squishy", "starry", "steamy", "stormy", "sunlit", "sunny", "super", "swift", "swirly", "swishy", "teal",
  "tidal", "tidy", "tiny", "trusty", "twinkly", "upbeat", "vivid", "wacky", "wavy", "wiggly", "wild", "windy", "wise",
  "zany", "zesty", "zippy",
];

export const NOUNS: readonly string[] = [
  "anchor", "aquifer", "bass", "bay", "beach", "beaver", "brook", "bubble", "bucket", "bullfrog", "buoy", "canal",
  "canoe", "carp", "catfish", "cattail", "clam", "cloud", "coral", "cove", "crab", "crayfish", "creek", "culvert",
  "current", "delta", "dewdrop", "dock", "dolphin", "drizzle", "droplet", "duck", "eagle", "egret", "estuary",
  "faucet", "ferry", "flipper", "fog", "fountain", "frog", "geyser", "glacier", "goldfish", "goose", "gulf", "guppy",
  "hailstone", "harbor", "heron", "hose", "hydrant", "iceberg", "icicle", "inlet", "island", "kayak", "kelp",
  "kettle", "koi", "lagoon", "lake", "levee", "lifeboat", "lily", "lilypad", "lobster", "loon", "manatee", "marsh",
  "mayfly", "mink", "minnow", "mist", "muskrat", "mussel", "narwhal", "newt", "ocean", "octopus", "orca", "osprey",
  "otter", "oyster", "paddle", "pebble", "pelican", "penguin", "perch", "pier", "pike", "pipe", "pond", "puddle",
  "puffin", "raft", "rain", "rainbow", "raincoat", "raindrop", "rapids", "reed", "reef", "ripple", "river", "rowboat",
  "sailboat", "salmon", "sea", "seahorse", "seal", "seaweed", "shark", "shell", "shore", "shrimp", "sleet", "snail",
  "snorkel", "snow", "splash", "sponge", "spring", "squid", "starfish", "stingray", "storm", "stream", "sunfish",
  "surfboard", "swan", "tadpole", "teapot", "thunder", "tide", "toad", "trout", "tugboat", "turtle", "umbrella",
  "walleye", "walrus", "wave", "wetland", "whale", "willow",
];

export const EXAMPLE_CARD_ID = "bubbly-misty-otter";

const pick = (list: readonly string[], random: () => number) => list[Math.floor(random() * list.length)] as string;

export function randomCardId(random: () => number = Math.random): string {
  const first = pick(ADJECTIVES, random);
  let second = pick(ADJECTIVES, random);
  while (second === first) second = pick(ADJECTIVES, random);
  return `${first}-${second}-${pick(NOUNS, random)}`;
}

/** `count` new IDs, all different from each other and from `taken`. */
export function randomCardIds(count: number, taken: Iterable<string> = [], random: () => number = Math.random) {
  const seen = new Set(taken);
  const out: string[] = [];
  while (out.length < count) {
    const id = randomCardId(random);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export type ParsedCardId =
  | { status: "ok"; id: string }
  | { status: "incomplete" }
  | { status: "error"; message: string };

/** An exact match, else the only word starting with `token`. */
function resolve(token: string, list: readonly string[]): string[] {
  return list.includes(token) ? [token] : list.filter((w) => w.startsWith(token));
}

/**
 * Reads a typed card ID. Forgiving for use at a busy event: any case, spaces or
 * dashes, and each word can be shortened to any prefix only one word starts with
 * ("bub mis ott"). Returns "incomplete" while the entry could still become an ID.
 */
export function parseCardId(input: string): ParsedCardId {
  const tokens = input.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (tokens.length > 3) return { status: "error", message: `A card ID is three words, like ${EXAMPLE_CARD_ID}.` };

  const words: string[] = [];
  for (const [i, token] of tokens.entries()) {
    const matches = resolve(token, i < 2 ? ADJECTIVES : NOUNS);
    const last = i === tokens.length - 1;
    if (matches.length === 0) return { status: "error", message: `No card ID has “${token}” there. Check the spelling.` };
    if (matches.length > 1) {
      if (last) return { status: "incomplete" };
      return { status: "error", message: `“${token}” could be more than one word. Type a bit more of it.` };
    }
    words.push(matches[0] as string);
  }

  if (words.length < 3) return { status: "incomplete" };
  if (words[0] === words[1]) return { status: "error", message: "No card uses the same word twice." };
  return { status: "ok", id: words.join("-") };
}

/** True for a well-formed ID exactly as printed, e.g. "bubbly-misty-otter". */
export function isCardId(id: string): boolean {
  const [a, b, n, ...rest] = id.split("-");
  return rest.length === 0 && a !== b && ADJECTIVES.includes(a ?? "") && ADJECTIVES.includes(b ?? "") && NOUNS.includes(n ?? "");
}
