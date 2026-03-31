export interface ServicePreset {
  name: string;
  plan_name: string;
  region: string;
  price: number;
  currency: string;
  category:
    | "Entertainment"
    | "Music"
    | "Software"
    | "Productivity"
    | "AI"
    | "Other";
  color: string;
  icon: string;
}

export const SERVICE_CATALOG: ServicePreset[] = [
  // ENTERTAINMENT
  {
    name: "Netflix",
    plan_name: "Temel",
    region: "TR",
    price: 189.99,
    currency: "TRY",
    category: "Entertainment",
    color: "#E50914",
    icon: "🎬",
  },
  {
    name: "Netflix",
    plan_name: "Standart",
    region: "TR",
    price: 289.99,
    currency: "TRY",
    category: "Entertainment",
    color: "#E50914",
    icon: "🎬",
  },
  {
    name: "Netflix",
    plan_name: "Premium",
    region: "TR",
    price: 379.99,
    currency: "TRY",
    category: "Entertainment",
    color: "#E50914",
    icon: "🎬",
  },
  {
    name: "Disney+",
    plan_name: "Aylık (Reklamsız)",
    region: "TR",
    price: 449.9,
    currency: "TRY",
    category: "Entertainment",
    color: "#006E99",
    icon: "🏰",
  },
  {
    name: "Amazon Prime",
    plan_name: "Prime Üyelik",
    region: "TR",
    price: 69.9,
    currency: "TRY",
    category: "Entertainment",
    color: "#00A8E1",
    icon: "📦",
  },
  {
    name: "BluTV",
    plan_name: "Aylık",
    region: "TR",
    price: 139.9,
    currency: "TRY",
    category: "Entertainment",
    color: "#00AEEF",
    icon: "📺",
  },
  {
    name: "Gain",
    plan_name: "Aylık",
    region: "TR",
    price: 149.0,
    currency: "TRY",
    category: "Entertainment",
    color: "#D9FD52",
    icon: "💎",
  },

  // MUSIC
  {
    name: "YouTube Premium",
    plan_name: "Bireysel",
    region: "TR",
    price: 79.99,
    currency: "TRY",
    category: "Music",
    color: "#FF0000",
    icon: "📺",
  },
  {
    name: "YouTube Premium",
    plan_name: "Aile",
    region: "TR",
    price: 159.99,
    currency: "TRY",
    category: "Music",
    color: "#FF0000",
    icon: "📺",
  },
  {
    name: "Spotify",
    plan_name: "Premium Bireysel",
    region: "TR",
    price: 99.0,
    currency: "TRY",
    category: "Music",
    color: "#1DB954",
    icon: "🎵",
  },
  {
    name: "Spotify",
    plan_name: "Premium Aile",
    region: "TR",
    price: 165.0,
    currency: "TRY",
    category: "Music",
    color: "#1DB954",
    icon: "🎵",
  },
  {
    name: "Apple Music",
    plan_name: "Bireysel",
    region: "TR",
    price: 79.99,
    currency: "TRY",
    category: "Music",
    color: "#FB233B",
    icon: "🍎",
  },

  // AI & SOFTWARE
  {
    name: "ChatGPT Plus",
    plan_name: "Pro",
    region: "US",
    price: 20.0,
    currency: "USD",
    category: "AI",
    color: "#10A37F",
    icon: "🤖",
  },
  {
    name: "Midjourney",
    plan_name: "Basic",
    region: "US",
    price: 10.0,
    currency: "USD",
    category: "AI",
    color: "#FFFFFF",
    icon: "🎨",
  },
  {
    name: "Claude Pro",
    plan_name: "Pro",
    region: "US",
    price: 20.0,
    currency: "USD",
    category: "AI",
    color: "#D97757",
    icon: "🧠",
  },
  {
    name: "Canva",
    plan_name: "Pro",
    region: "TR",
    price: 199.99,
    currency: "TRY",
    category: "Software",
    color: "#00C4CC",
    icon: "✨",
  },

  // OTHERS
  {
    name: "Medium",
    plan_name: "Member",
    region: "US",
    price: 5.0,
    currency: "USD",
    category: "Other",
    color: "#000000",
    icon: "✍️",
  },
  {
    name: "X Premium",
    plan_name: "Individual",
    region: "TR",
    price: 150.0,
    currency: "TRY",
    category: "Other",
    color: "#000000",
    icon: "𝕏",
  },
];
