import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface IconSet {
  id: string;
  name: string;
  description: string;
  license: string;
  frameworks: string[];
  styles: string[];
  best_for: string[];
  vibes: string[];
  website_url: string;
  github_url?: string;
  npm_command?: string;
  detailed_description?: string;
  is_favorited?: boolean;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetIconSetsRequest {
  userId: string;
}

interface GetIconSetsResponse {
  icon_sets: IconSet[];
}

interface GetIconSetDetailRequest {
  id: string;
  userId: string;
}

interface ToggleFavoriteRequest {
  userId: string;
  iconSetId: string;
}

interface ToggleFavoriteResponse {
  is_favorited: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Lists all icon sets with favorite info for the user
 * GET /icon-set-guide/list/:userId
 */
export const getIconSets = api(
  { expose: true, method: "GET", path: "/icon-set-guide/list/:userId" },
  async ({ userId }: GetIconSetsRequest): Promise<GetIconSetsResponse> => {
    const { data, error } = await supabase.schema("icon_set_guide").rpc("get_icon_sets", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getIconSets error:", error);
      throw APIError.internal(`Failed to load icon sets: ${error.message}`);
    }

    return { icon_sets: data || [] };
  }
);

/**
 * Gets details for a specific icon set
 * GET /icon-set-guide/detail/:id/:userId
 */
export const getIconSetDetail = api(
  { expose: true, method: "GET", path: "/icon-set-guide/detail/:id/:userId" },
  async ({ id, userId }: GetIconSetDetailRequest): Promise<IconSet> => {
    const { data, error } = await supabase.schema("icon_set_guide").rpc("get_icon_set_detail", {
      id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getIconSetDetail error:", error);
      throw APIError.internal(`Failed to load icon set detail: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw APIError.notFound("Icon set not found");
    }

    return row;
  }
);

/**
 * Toggles the favorite status of an icon set for the user
 * POST /icon-set-guide/favorite
 */
export const toggleFavorite = api(
  { expose: true, method: "POST", path: "/icon-set-guide/favorite" },
  async ({ userId, iconSetId }: ToggleFavoriteRequest): Promise<ToggleFavoriteResponse> => {
    const { data, error } = await supabase.schema("icon_set_guide").rpc("toggle_favorite", {
      clerk_id_param: userId,
      icon_set_id_param: iconSetId,
    });

    if (error) {
      console.error("toggleFavorite error:", error);
      throw APIError.internal(`Failed to toggle favorite: ${error.message}`);
    }

    return { is_favorited: data as boolean };
  }
);

/**
 * Seeds the database with the initial 20 icon sets
 * POST /icon-set-guide/seed
 */
export const seedIconSets = api(
  { expose: true, method: "POST", path: "/icon-set-guide/seed" },
  async (): Promise<{ count: number; errors: string[] }> => {
    const iconSets: IconSet[] = [
      {
        id: "lucide",
        name: "Lucide",
        description: "Beautiful & consistent icon toolkit, community run fork of Feather Icons.",
        license: "MIT",
        frameworks: ["React", "Vue", "Svelte", "Angular", "SVG", "Figma", "npm"],
        styles: ["outline", "rounded", "minimal"],
        best_for: ["SaaS dashboard", "admin panel", "web app", "AI tool"],
        vibes: ["minimal", "developer-ish", "friendly"],
        website_url: "https://lucide.dev",
        github_url: "https://github.com/lucide-icons/lucide",
        npm_command: "npm install lucide-react",
        detailed_description: "Lucide provides clean, scalable, and highly customizable stroke-based vector icons. It is widely adopted in modern web applications due to its extensive library and robust framework bindings."
      },
      {
        id: "tabler-icons",
        name: "Tabler Icons",
        description: "Over 5200 pixel-perfect vector icons for modern web design.",
        license: "MIT",
        frameworks: ["React", "Vue", "Svelte", "SVG", "Figma", "npm"],
        styles: ["outline", "filled", "rounded"],
        best_for: ["admin panel", "SaaS dashboard", "finance app", "landing page"],
        vibes: ["minimal", "developer-ish", "corporate"],
        website_url: "https://tabler.io/icons",
        github_url: "https://github.com/tabler/tabler-icons",
        npm_command: "npm install @tabler/icons-react",
        detailed_description: "A colossal set of beautifully designed icons, built on a 24x24 grid. It offers customization for stroke-width, sizing, and color natively, making it a perfect fit for complex web systems."
      },
      {
        id: "heroicons",
        name: "Heroicons",
        description: "Beautiful hand-crafted SVG icons by the makers of Tailwind CSS.",
        license: "MIT",
        frameworks: ["React", "Vue", "SVG", "Figma", "npm"],
        styles: ["outline", "solid"],
        best_for: ["landing page", "SaaS dashboard", "mobile app", "e-commerce"],
        vibes: ["minimal", "premium", "corporate"],
        website_url: "https://heroicons.com",
        github_url: "https://github.com/tailwindlabs/heroicons",
        npm_command: "npm install @heroicons/react",
        detailed_description: "Tailored perfectly to fit Tailwind UI styles. Heroicons offers three styling layouts: 24x24 Outline (2px stroke), 24x24 Solid (filled), and a compact 20x20 Solid layout for tighter spacing."
      },
      {
        id: "phosphor-icons",
        name: "Phosphor Icons",
        description: "A flexible icon family for interfaces, diagrams, presentations, and more.",
        license: "MIT",
        frameworks: ["React", "Vue", "Svelte", "SVG", "Figma", "npm"],
        styles: ["outline", "solid", "duotone", "filled", "rounded"],
        best_for: ["mobile app", "SaaS dashboard", "landing page", "AI tool", "e-commerce"],
        vibes: ["friendly", "playful", "minimal", "premium"],
        website_url: "https://phosphoricons.com",
        github_url: "https://github.com/phosphor-icons/core",
        npm_command: "npm install @phosphor-icons/react",
        detailed_description: "Phosphor features a consistent structure across 6 distinct weights: Thin, Light, Regular, Bold, Fill, and Duotone. It has a friendly and organic rounded personality."
      },
      {
        id: "remix-icon",
        name: "Remix Icon",
        description: "Open-source neutral-style system symbols for designers and developers.",
        license: "Apache",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["outline", "filled"],
        best_for: ["admin panel", "SaaS dashboard", "finance app", "mobile app"],
        vibes: ["minimal", "corporate", "developer-ish"],
        website_url: "https://remixicon.com",
        github_url: "https://github.com/Remix-Design/RemixIcon",
        npm_command: "npm install remixicon",
        detailed_description: "Remix Icon provides a massive collection of elegant, neutral-styled vector icons, carefully categorized. Each icon comes in both outline and filled styles for design consistency."
      },
      {
        id: "radix-icons",
        name: "Radix Icons",
        description: "A crisp set of 15x15 icons designed by WorkOS for Radix UI.",
        license: "MIT",
        frameworks: ["React", "SVG", "Figma", "npm"],
        styles: ["outline", "minimal"],
        best_for: ["SaaS dashboard", "admin panel", "AI tool"],
        vibes: ["minimal", "developer-ish", "premium"],
        website_url: "https://icons.radix-ui.com",
        github_url: "https://github.com/radix-ui/icons",
        npm_command: "npm install @radix-ui/react-icons",
        detailed_description: "Radix Icons are meticulously aligned to a strict 15x15 pixel grid. It is highly optimized for complex interfaces, dense information displays, and clean design environments."
      },
      {
        id: "material-symbols",
        name: "Material Symbols",
        description: "Google's newest icon library consolidation representing modern design styles.",
        license: "Apache",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["outline", "filled", "rounded", "solid"],
        best_for: ["mobile app", "admin panel", "finance app", "e-commerce"],
        vibes: ["corporate", "friendly", "minimal"],
        website_url: "https://fonts.google.com/icons",
        github_url: "https://github.com/google/material-design-icons",
        npm_command: "npm install material-symbols",
        detailed_description: "Material Symbols packs over 3,000 icons into a single variable font file with four adjustable axes: fill, weight, grade, and optical size, allowing perfect matching to your typography."
      },
      {
        id: "bootstrap-icons",
        name: "Bootstrap Icons",
        description: "Free, high-quality, open-source icon library with over 2,000 SVGs.",
        license: "MIT",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["outline", "filled"],
        best_for: ["landing page", "admin panel", "e-commerce"],
        vibes: ["corporate", "friendly"],
        website_url: "https://icons.getbootstrap.com",
        github_url: "https://github.com/twbs/icons",
        npm_command: "npm install bootstrap-icons",
        detailed_description: "Initially created for Bootstrap frontend framework, but usable anywhere. Clean SVGs designed to style naturally with your fonts and Tailwind or Bootstrap utilities."
      },
      {
        id: "iconoir",
        name: "Iconoir",
        description: "One of the biggest open-source libraries, offering clean line icons.",
        license: "MIT",
        frameworks: ["React", "Vue", "Svelte", "SVG", "Figma", "npm"],
        styles: ["outline", "minimal"],
        best_for: ["SaaS dashboard", "AI tool", "finance app", "landing page"],
        vibes: ["minimal", "developer-ish", "premium"],
        website_url: "https://iconoir.com",
        github_url: "https://github.com/iconoir-icons/iconoir",
        npm_command: "npm install iconoir-react",
        detailed_description: "Iconoir is a massive library with no paywalls or premium tiers. Features incredibly clean geometries, consistent styling, and excellent CSS styling capabilities."
      },
      {
        id: "mingcute",
        name: "MingCute Icons",
        description: "Simple, exquisite, and fresh open-source vector icon library.",
        license: "Apache",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["outline", "filled", "rounded"],
        best_for: ["mobile app", "landing page", "e-commerce"],
        vibes: ["friendly", "playful", "minimal"],
        website_url: "https://www.mingcute.com",
        github_url: "https://github.com/AdamCui/mingcute_icons",
        npm_command: "npm install mingcute_icons",
        detailed_description: "Designed with a friendly vibe. MingCute is perfect for consumer-facing apps, mobile layouts, and modern dashboards that want to look welcoming rather than overly corporate."
      },
      {
        id: "feather-icons",
        name: "Feather Icons",
        description: "Simply beautiful open source icons, emphasis on simplicity, consistency, and readability.",
        license: "MIT",
        frameworks: ["React", "SVG", "npm"],
        styles: ["outline", "minimal"],
        best_for: ["SaaS dashboard", "landing page", "minimal web app"],
        vibes: ["minimal", "developer-ish"],
        website_url: "https://feathericons.com",
        github_url: "https://github.com/feathericons/feather",
        npm_command: "npm install feather-icons",
        detailed_description: "The classic line-art icon toolkit that inspired modern line icon sets. Fixed 24x24 grid with round caps and consistent 2px strokes."
      },
      {
        id: "solar-icons",
        name: "Solar Icons",
        description: "Stunning set of modern line and duotone icons for designs that pop.",
        license: "MIT",
        frameworks: ["React", "SVG", "Figma", "npm"],
        styles: ["outline", "solid", "duotone", "filled"],
        best_for: ["mobile app", "finance app", "AI tool", "premium web app"],
        vibes: ["premium", "playful", "friendly"],
        website_url: "https://icon-sets.iconify.design/solar/",
        github_url: "https://github.com/48px/Solar-Icons",
        npm_command: "npm install @solar-icons/react",
        detailed_description: "Solar Icons features a modern layout with thick lines, round corners, and creative duotone configurations that give interfaces an ultra-modern, premium appearance."
      },
      {
        id: "hugeicons",
        name: "Hugeicons",
        description: "Beautifully balanced stroke and fill icons for high-end web projects.",
        license: "Free",
        frameworks: ["React", "Vue", "SVG", "Figma", "npm"],
        styles: ["outline", "solid", "duotone", "rounded"],
        best_for: ["AI tool", "premium web app", "finance app", "SaaS dashboard"],
        vibes: ["premium", "minimal", "developer-ish"],
        website_url: "https://hugeicons.com",
        github_url: "https://github.com/hugeicons/hugeicons-react",
        npm_command: "npm install hugeicons-react",
        detailed_description: "Hugeicons is a professional, high-end collection crafted for clean layout alignment. The free tier offers a rich set of icons with smooth curves."
      },
      {
        id: "flowbite-icons",
        name: "Flowbite Icons",
        description: "SVG icons built specifically for use with Tailwind CSS and Flowbite components.",
        license: "MIT",
        frameworks: ["React", "Vue", "SVG", "Figma", "npm"],
        styles: ["outline", "solid"],
        best_for: ["landing page", "admin panel", "SaaS dashboard"],
        vibes: ["minimal", "corporate"],
        website_url: "https://flowbite.com/icons/",
        github_url: "https://github.com/themesberg/flowbite-icons",
        npm_command: "npm install flowbite-react-icons",
        detailed_description: "Optimized for Tailwind utility workflows, containing outline and solid layouts. They scale seamlessly inside buttons, tabs, dropdowns, and navigation grids."
      },
      {
        id: "css-gg",
        name: "CSS.gg",
        description: "Pure CSS, SVG & Figma icons. Ultra-lightweight and programmatically styleable.",
        license: "MIT",
        frameworks: ["React", "SVG", "npm"],
        styles: ["outline", "minimal"],
        best_for: ["minimal web app", "AI tool", "developer portfolios"],
        vibes: ["minimal", "developer-ish"],
        website_url: "https://css.gg",
        github_url: "https://github.com/astrit/css.gg",
        npm_command: "npm install css.gg",
        detailed_description: "A highly technical, geometric set of icons that can be loaded purely via CSS animations and variables, or as standard SVG/React components."
      },
      {
        id: "eva-icons",
        name: "Eva Icons",
        description: "A pack of more than 480 beautifully crafted open source icons.",
        license: "MIT",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["outline", "filled", "rounded"],
        best_for: ["mobile app", "landing page", "e-commerce"],
        vibes: ["friendly", "playful"],
        website_url: "https://akveo.github.io/eva-icons/",
        github_url: "https://github.com/akveo/eva-icons",
        npm_command: "npm install eva-icons",
        detailed_description: "Eva Icons supports zoom/shake hover micro-animations natively, making it a very interactive and dynamic icon set for action buttons."
      },
      {
        id: "octicons",
        name: "Octicons",
        description: "GitHub's official icon set, designed for developers and code repositories.",
        license: "MIT",
        frameworks: ["React", "SVG", "npm"],
        styles: ["outline", "minimal"],
        best_for: ["admin panel", "SaaS dashboard", "developer portfolios"],
        vibes: ["developer-ish", "corporate"],
        website_url: "https://primer.style/octicons/",
        github_url: "https://github.com/primer/octicons",
        npm_command: "npm install @primer/octicons-react",
        detailed_description: "GitHub's custom design system icons. Highly consistent, built specifically for layout displays, commits, branching, pull requests, and dev settings."
      },
      {
        id: "simple-icons",
        name: "Simple Icons",
        description: "Over 3,000 free SVG icons for popular brands and company logos.",
        license: "CC0",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["solid", "filled"],
        best_for: ["landing page", "developer portfolios", "e-commerce"],
        vibes: ["corporate", "minimal"],
        website_url: "https://simpleicons.org",
        github_url: "https://github.com/simple-icons/simple-icons",
        npm_command: "npm install simple-icons",
        detailed_description: "A specialized library of SVGs representing logos and brand symbols from all over the tech, design, and business landscapes."
      },
      {
        id: "carbon-icons",
        name: "Carbon Icons",
        description: "IBM's official design system icons. Professional, technical, and precise.",
        license: "Apache",
        frameworks: ["React", "Vue", "SVG", "npm"],
        styles: ["outline", "minimal"],
        best_for: ["SaaS dashboard", "finance app", "admin panel"],
        vibes: ["corporate", "developer-ish", "minimal"],
        website_url: "https://carbondesignsystem.com",
        github_url: "https://github.com/carbon-design-system/carbon",
        npm_command: "npm install @carbon/icons-react",
        detailed_description: "IBM's core design system icons, built on an elegant, sharp geometric structure. Very professional aesthetic suited for enterprise SaaS and complex applications."
      },
      {
        id: "fluent-ui-icons",
        name: "Fluent UI Icons",
        description: "Microsoft's official Fluent design system icons for cross-platform apps.",
        license: "MIT",
        frameworks: ["React", "SVG", "npm"],
        styles: ["outline", "filled", "rounded"],
        best_for: ["SaaS dashboard", "admin panel", "finance app", "mobile app"],
        vibes: ["corporate", "friendly"],
        website_url: "https://github.com/microsoft/fluentui-system-icons",
        github_url: "https://github.com/microsoft/fluentui-system-icons",
        npm_command: "npm install @fluentui/react-icons",
        detailed_description: "A comprehensive design suite featuring regular, solid, and filled layouts. Aligned with Windows 11 styling guidelines, suitable for clean, enterprise-grade business interfaces."
      }
    ];

    let count = 0;
    const errors: string[] = [];
    for (const iconSet of iconSets) {
      const { error } = await supabase
        .schema("icon_set_guide")
        .from("icon_sets")
        .upsert(iconSet, { onConflict: "id" });

      if (error) {
        console.error(`Failed to seed ${iconSet.name}:`, error.message);
        errors.push(`Failed to seed ${iconSet.name}: ${error.message}`);
      } else {
        count++;
      }
    }

    return { count, errors };
  }
);
