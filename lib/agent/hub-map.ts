import {hubSections, type HubSectionSlug} from "@/lib/hub-navigation";
import type {AppLocale} from "@/i18n/request";

/**
 * The agent's map of this site.
 *
 * This is the ONLY place the assistant learns what lives where, so it is typed
 * as `Record<HubSectionSlug, ...>` on purpose: adding a slug to `hubSections`
 * breaks the build here until the agent is taught about it too. Keep the
 * english-only prose short — it is injected into the system prompt on every
 * request and the model translates it into the visitor's locale.
 */
export interface HubSectionEntry {
  /** What a visitor actually finds on the page. */
  summary: string;
  /** Concrete things the page contains — used for "where do I find X". */
  contains: string[];
  /** Lowercase match terms across all five locales for the offline fallback. */
  keywords: string[];
  /** External destinations reachable from the section. */
  links?: Array<{label: string; url: string}>;
}

export const DISCORD_URL = "https://discord.gg/standx";
export const STANDX_APP_URL = "https://standx.com/";
export const STANDX_X_URL = "https://x.com/StandX_Official";
export const DOCS_ROOT_URL = "https://docs.standx.com/docs/about-standx";

export const hubSectionMap: Record<HubSectionSlug, HubSectionEntry> = {
  "getting-started": {
    summary:
      "The onboarding path for the community: the StandX Growth Path (Stander -> SEED -> SPROUT -> FLOWER), the five squads, and the exact Discord channels used at each step.",
    contains: [
      "Growth Path explained step by step",
      "3,000 Engage Points to reach @Stander, then apply for @SEED in #seed-application",
      "Squad selection via #support-ticket",
      "Tasks posted in #task-board, submitted in #task-submission",
      "SPROUT criteria per squad (Engage >= 4,000 plus squad deliverables)",
      "The five squads: Content/Research, Creative, Tech Support, Outreach, Offline"
    ],
    keywords: [
      "getting started",
      "start",
      "begin",
      "onboarding",
      "growth path",
      "seed",
      "sprout",
      "flower",
      "stander",
      "squad",
      "squads",
      "engage points",
      "rank",
      "role",
      "level up",
      "empezar",
      "como empezar",
      "comenzar",
      "inicio",
      "rango",
      "comecar",
      "como comecar",
      "inicio",
      "почати",
      "початок",
      "시작",
      "가이드",
      "はじめかた",
      "始め方",
      "始め方は",
      "始めかた",
      "オンボーディング",
      "参加方法",
      "昇格"
    ],
    links: [{label: "StandX Discord", url: DISCORD_URL}]
  },
  "brand-kit": {
    summary:
      "Community-made visual assets so contributors can publish without designing from scratch. Everything is hosted on Google Drive and Notion.",
    contains: [
      "Mascot assets (full body, half body, head only, utility poses) as transparent PNGs",
      "Emotion and reaction packs: Bullish, Bearish, GG, Loss, Alert, Idea",
      "Mascot scenes and full illustrations for long-form educational content",
      "The full kit root folder for bulk download",
      "Notion page for the StandX Community Brand Kit"
    ],
    keywords: [
      "brand kit",
      "brand",
      "assets",
      "logo",
      "mascot",
      "sticker",
      "stickers",
      "png",
      "illustration",
      "design",
      "drive",
      "download",
      "marca",
      "recursos",
      "imagenes",
      "imagens",
      "mascota",
      "mascote",
      "descargar",
      "baixar",
      "бренд",
      "логотип",
      "브랜드",
      "키트",
      "에셋",
      "ブランドキット",
      "ブランド",
      "アセット",
      "ロゴ",
      "ロゴ素材",
      "マスコット",
      "素材",
      "画像素材"
    ],
    links: [
      {
        label: "Brand Kit root folder (Drive)",
        url: "https://drive.google.com/drive/folders/13cLiJ2XjHvHLzx_44ZVqI4tNPFVJqN0m?usp=drive_link"
      },
      {
        label: "Brand Kit on Notion",
        url: "https://www.notion.so/StandX-Community-Brand-Kit-2cf509c0f89780c9a435f005e8afdc08"
      }
    ]
  },
  templates: {
    summary:
      "Copy-paste content skeletons contributors adapt to their own voice — thread structures, explainer outlines, and post formats.",
    contains: [
      "Ready-made structures for X threads and educational posts",
      "Placeholders to replace while keeping a consistent shape",
      "Guidance to keep structure and swap only the specifics"
    ],
    keywords: [
      "template",
      "templates",
      "thread",
      "post",
      "format",
      "structure",
      "copy",
      "writing",
      "plantilla",
      "plantillas",
      "estructura",
      "modelo",
      "modelos",
      "шаблон",
      "шаблони",
      "템플릿",
      "구조",
      "テンプレート",
      "テンプレ",
      "ひな形",
      "ひな形は",
      "雛形"
    ]
  },
  references: {
    summary:
      "Real published examples of StandX community content — different formats, languages and approaches, each linking to the original post.",
    contains: [
      "Long-form written analysis on X",
      "Hand-drawn and painted mascot art",
      "Narrated technical video with captions",
      "Real-world photo content",
      "Market analysis narrated by a trader",
      "The Brand Kit launch post"
    ],
    keywords: [
      "reference",
      "references",
      "example",
      "examples",
      "showcase",
      "inspiration",
      "referencia",
      "referencias",
      "ejemplo",
      "ejemplos",
      "referencia",
      "exemplo",
      "приклад",
      "приклади",
      "레퍼런스",
      "예시",
      "リファレンス",
      "参考",
      "参考事例",
      "参考リンク",
      "事例"
    ]
  },
  community: {
    summary:
      "Where the community actually gathers, plus the tools and games members have built, and recognition for active creators.",
    contains: [
      "Direct Discord entry point",
      "StandX Flappy — community arcade game",
      "StandX RPG — community role-playing game",
      "StandX Stats — community stats dashboard",
      "Stand Cup — community tournament matches",
      "StandX SIP Visual Guide — the SIPs explained visually",
      "Featured creators: Jovan (@JovanNeves), RyuDex (@RyuuDefi), Victor (@victordesouza96), Dias (@diaserdropes)"
    ],
    keywords: [
      "community",
      "discord",
      "join",
      "chat",
      "game",
      "games",
      "play",
      "project",
      "projects",
      "tools",
      "stats",
      "creators",
      "comunidad",
      "unirse",
      "juego",
      "juegos",
      "proyectos",
      "comunidade",
      "jogo",
      "jogos",
      "projetos",
      "спільнота",
      "гра",
      "проєкти",
      "커뮤니티",
      "게임",
      "프로젝트",
      "コミュニティ",
      "参加",
      "参加したい",
      "ゲーム",
      "プロジェクト"
    ],
    links: [
      {label: "StandX Discord", url: DISCORD_URL},
      {label: "StandX Flappy", url: "https://standx-flappy.vercel.app/"},
      {label: "StandX RPG", url: "https://rpg-standx-game.vercel.app/"},
      {label: "StandX Stats", url: "https://standx-stats.vercel.app/"},
      {label: "Stand Cup", url: "https://stand-cup.vercel.app/matches"},
      {label: "SIP Visual Guide", url: "https://standx-sip-guide.vercel.app/"}
    ]
  },
  "standers-insights": {
    summary:
      "Curated, editorially reviewed analysis written by active community members. Articles are in English and hosted on Notion.",
    contains: [
      "Building Positions That Stay and Pay on StandX — @Geraldi86116885 (Perps Guide)",
      "Your Stop Loss Is Not Your Risk — @Geraldi86116885 (Perps Guide)",
      "Frozen Margin Syndrome — @ttayfun_0 (Perps Guide)",
      "Trading Smarter on StandX — @JovanNeves (Perps Guide)",
      "StandX - From Day One to Today — @CrryptoKerim (StandX Insight)",
      "StandX Key Milestones & Activities Recap — @dudulinux (StandX Insight)"
    ],
    keywords: [
      "insights",
      "standers insights",
      "article",
      "articles",
      "analysis",
      "research",
      "read",
      "blog",
      "articulo",
      "articulos",
      "analisis",
      "artigo",
      "artigos",
      "analise",
      "стаття",
      "статті",
      "аналітика",
      "인사이트",
      "아티클",
      "분석",
      "インサイト",
      "記事",
      "記事一覧",
      "分析",
      "分析記事"
    ]
  },
  about: {
    summary:
      "Who built this hub and why. Credit to the original community initiative by @TARZANWEB3, redesigned by @Thisnotmeeme.",
    contains: [
      "Origin of the hub as a community initiative",
      "Credit to @TARZANWEB3 for the original site",
      "Redesign credit to @Thisnotmeeme",
      "Note that the hub is educational, not official financial advice"
    ],
    keywords: [
      "about",
      "who made",
      "credits",
      "author",
      "history",
      "why",
      "acerca",
      "sobre",
      "creditos",
      "quien",
      "quem",
      "про",
      "хто",
      "소개",
      "누가",
      "概要",
      "概要ページ",
      "概要のページ",
      "誰が",
      "誰が作った",
      "作った人",
      "このハブ"
    ]
  }
};

/** Non-section routes the assistant can also send people to. */
export const extraRoutes = [
  {
    path: "",
    label: "Home",
    summary:
      "The landing page: hero, what the hub is, the live ticker, and the directory of every section.",
    keywords: ["home", "landing", "start page", "inicio", "casa", "головна", "홈", "ホーム", "ホームに", "ホームへ", "トップ", "トップページ"]
  },
  {
    path: "how-it-works",
    label: "How It Works",
    summary:
      "A three-step visual onboarding for the StandX product itself: connect a wallet, deposit collateral and understand DUSD, then trade perpetuals and monitor yield. Includes a short glossary (perpetuals, collateral, yield, leverage).",
    keywords: [
      "how it works",
      "how does it work",
      "wallet",
      "connect",
      "deposit",
      "glossary",
      "como funciona",
      "billetera",
      "cartera",
      "carteira",
      "glosario",
      "glossario",
      // Substring matching, so index the distinctive stem rather than a whole
      // phrase — "як це працює" would miss a literal "як працює".
      "працює",
      "гаманець",
      "словник",
      "작동",
      "지갑",
      "용어",
      "仕組み",
      "仕組みは",
      "仕組みを",
      "仕組みの",
      "使いかた",
      "ウォレット",
      "用語",
      "用語集は"
    ]
  }
] as const;

export type ExtraRoutePath = (typeof extraRoutes)[number]["path"];

/** Every route the `navigate` tool is allowed to target, without the locale prefix. */
export const navigableRoutes: string[] = [
  ...extraRoutes.map((route) => route.path),
  ...hubSections
];

export function isNavigableRoute(value: string): boolean {
  return navigableRoutes.includes(value);
}

export function buildHref(locale: AppLocale, route: string): string {
  return route ? `/${locale}/${route}` : `/${locale}`;
}
