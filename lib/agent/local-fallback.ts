import type {AppLocale} from "@/i18n/request";
import {hubSections, type HubSectionSlug} from "@/lib/hub-navigation";
import {
  DISCORD_URL,
  DOCS_ROOT_URL,
  buildHref,
  extraRoutes,
  hubSectionMap
} from "@/lib/agent/hub-map";
import {findDoc, type DocEntry} from "@/lib/agent/standx-knowledge";
import type {AgentLink, AgentMessage, AgentNavigation} from "@/lib/agent/types";

/**
 * Offline brain. Runs when no model provider is configured (or the provider
 * call fails) so the hologram is never a dead widget: it still routes people to
 * the right page and the right doc, it just does not converse.
 *
 * Deliberately keyword-based — no network, no key, deterministic.
 */

export interface LocalAnswer {
  text: string;
  navigation?: AgentNavigation;
  links: AgentLink[];
}

type Copy = Record<AppLocale, string>;

const copy = {
  routed: {
    en: "That lives in {section} — taking you there now.",
    es: "Eso está en {section}. Te llevo ahí ahora.",
    "pt-br": "Isso fica em {section}. Estou te levando pra lá.",
    uk: "Це в розділі {section} — переходжу туди.",
    ko: "{section} 섹션에 있어요. 지금 이동할게요."
  } satisfies Copy,
  alreadyHere: {
    en: "You are already on {section} — it is all on this page.",
    es: "Ya estás en {section}: está todo en esta página.",
    "pt-br": "Você já está em {section} — está tudo nesta página.",
    uk: "Ви вже в розділі {section} — усе на цій сторінці.",
    ko: "이미 {section} 페이지에 계세요. 필요한 내용이 여기 있어요."
  } satisfies Copy,
  docs: {
    en: "The official documentation covers that. Here is the page:",
    es: "La documentación oficial lo cubre. Aquí tienes la página:",
    "pt-br": "A documentação oficial cobre isso. Aqui está a página:",
    uk: "Це описано в офіційній документації. Ось сторінка:",
    ko: "공식 문서에 해당 내용이 있어요. 이 페이지를 확인하세요:"
  } satisfies Copy,
  offline: {
    en: "I am running in offline mode right now, so I can point you to the right page but I cannot chat properly. Try the sections below, the Discord, or the official docs.",
    es: "Ahora mismo estoy en modo offline: puedo indicarte la página correcta, pero no conversar del todo. Prueba las secciones, el Discord o la documentación oficial.",
    "pt-br":
      "Estou em modo offline agora: consigo te indicar a página certa, mas não conversar direito. Veja as seções, o Discord ou a documentação oficial.",
    uk: "Зараз я в офлайн-режимі: можу підказати потрібну сторінку, але не поспілкуватись повноцінно. Спробуйте розділи, Discord або офіційну документацію.",
    ko: "지금은 오프라인 모드예요. 알맞은 페이지는 안내할 수 있지만 대화는 어렵습니다. 아래 섹션이나 Discord, 공식 문서를 확인해 주세요."
  } satisfies Copy,
  discordLabel: {
    en: "StandX Discord",
    es: "Discord de StandX",
    "pt-br": "Discord da StandX",
    uk: "StandX Discord",
    ko: "StandX Discord"
  } satisfies Copy,
  docsLabel: {
    en: "Official documentation",
    es: "Documentación oficial",
    "pt-br": "Documentação oficial",
    uk: "Офіційна документація",
    ko: "공식 문서"
  } satisfies Copy
};

const sectionLabels: Record<AppLocale, Record<HubSectionSlug, string>> = {
  en: {
    "getting-started": "Getting Started",
    "brand-kit": "Brand Kit",
    templates: "Templates",
    references: "References",
    community: "Community",
    "standers-insights": "Standers Insights",
    about: "About"
  },
  es: {
    "getting-started": "Cómo Empezar",
    "brand-kit": "Brand Kit",
    templates: "Plantillas",
    references: "Referencias",
    community: "Comunidad",
    "standers-insights": "Standers Insights",
    about: "Acerca de"
  },
  "pt-br": {
    "getting-started": "Como Começar",
    "brand-kit": "Brand Kit",
    templates: "Templates",
    references: "Referências",
    community: "Comunidade",
    "standers-insights": "Standers Insights",
    about: "Sobre"
  },
  uk: {
    "getting-started": "Початок",
    "brand-kit": "Brand Kit",
    templates: "Шаблони",
    references: "Приклади",
    community: "Спільнота",
    "standers-insights": "Standers Insights",
    about: "Про хаб"
  },
  ko: {
    "getting-started": "시작 가이드",
    "brand-kit": "브랜드 키트",
    templates: "템플릿",
    references: "레퍼런스",
    community: "커뮤니티",
    "standers-insights": "Standers Insights",
    about: "소개"
  }
};

/** The two non-section routes. Section labels live in `sectionLabels` above. */
const extraRouteLabels: Record<AppLocale, Record<string, string>> = {
  en: {"": "Home", "how-it-works": "How It Works"},
  es: {"": "Inicio", "how-it-works": "Cómo Funciona"},
  "pt-br": {"": "Início", "how-it-works": "Como Funciona"},
  uk: {"": "Головна", "how-it-works": "Як це працює"},
  ko: {"": "홈", "how-it-works": "작동 방식"}
};

/**
 * Doc topics the fallback can resolve without a model. Pages are referenced by
 * title through `findDoc`, which throws on a miss — an index into `docPages`
 * would silently shift the moment a page is inserted.
 */
const docTopics: Array<{terms: string[]; doc: DocEntry}> = [
  {
    terms: ["dusd", "stablecoin", "estable", "estável", "стейблкоїн", "스테이블"],
    doc: findDoc("$DUSD Overview")
  },
  {
    terms: ["mint", "minting", "mintear", "acuñar", "cunhar", "мінт", "민팅"],
    doc: findDoc("Minting DUSD")
  },
  {
    terms: ["redeem", "redimir", "resgatar", "погашення", "상환"],
    doc: findDoc("Redeeming DUSD")
  },
  {
    terms: [
      "fee",
      "fees",
      "comision",
      "comisiones",
      "taxa",
      "taxas",
      "maker",
      "taker",
      "комісія",
      "комісії",
      "수수료"
    ],
    doc: findDoc("Trading Fee")
  },
  {
    terms: [
      "leverage",
      "margin",
      "apalancamiento",
      "margen",
      "alavancagem",
      "margem",
      "плече",
      "маржа",
      "레버리지",
      "마진"
    ],
    doc: findDoc("Margin & Leverage")
  },
  {
    terms: ["liquidation", "liquidacion", "liquidação", "ліквідація", "청산"],
    doc: findDoc("Liquidation")
  },
  {
    terms: ["funding", "funding rate", "financiamento", "фандинг", "펀딩"],
    doc: findDoc("Funding Rate")
  },
  {
    terms: ["wallet", "billetera", "cartera", "carteira", "гаманець", "지갑"],
    doc: findDoc("StandX Wallet Guide")
  },
  {
    terms: ["withdraw", "withdrawal", "retirar", "sacar", "виведення", "출금"],
    doc: findDoc("Withdrawal")
  },
  {
    terms: ["referral", "network yield", "referido", "indicação", "реферал", "레퍼럴"],
    doc: findDoc("Network Yield")
  },
  {
    terms: ["sip", "sips", "proposal", "propuesta", "proposta"],
    doc: findDoc("SIPs (StandX Improvement Proposals)")
  },
  {terms: ["api", "websocket", "rest", "endpoint"], doc: findDoc("API Reference")}
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Terms score a flat base plus a length bonus. Scoring purely on length would
 * systematically under-rank CJK, where a whole word ("키트", "커뮤니티") is two
 * to four characters and would never reach the same total as an English phrase.
 */
const MATCH_BASE = 4;
const ROUTE_THRESHOLD = 8;
const DOC_THRESHOLD = 7;

function scoreTerms(haystack: string, terms: readonly string[]): number {
  let score = 0;
  for (const term of terms) {
    const needle = normalize(term);
    if (needle.length < 2) {
      continue;
    }
    if (haystack.includes(needle)) {
      // Longer matches are more specific, so they still weigh more.
      score += MATCH_BASE + Math.min(8, needle.length);
    }
  }
  return score;
}

function lastUserMessage(messages: AgentMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index].content;
    }
  }
  return "";
}

export function buildLocalAnswer(
  messages: AgentMessage[],
  locale: AppLocale,
  currentRoute: string
): LocalAnswer {
  const question = normalize(lastUserMessage(messages));
  const links: AgentLink[] = [];

  if (!question) {
    return {text: copy.offline[locale], links};
  }

  const docMatch = docTopics
    .map((topic) => ({topic, score: scoreTerms(question, topic.terms)}))
    .sort((a, b) => b.score - a.score)
    .find((entry) => entry.score >= DOC_THRESHOLD);

  let bestSection: {slug: HubSectionSlug; score: number} | null = null;
  for (const slug of hubSections) {
    const score = scoreTerms(question, hubSectionMap[slug].keywords);
    if (!bestSection || score > bestSection.score) {
      bestSection = {slug, score};
    }
  }

  let bestExtra: {path: string; score: number} | null = null;
  for (const route of extraRoutes) {
    const score = scoreTerms(question, route.keywords);
    if (!bestExtra || score > bestExtra.score) {
      bestExtra = {path: route.path, score};
    }
  }

  const sectionScore = bestSection?.score ?? 0;
  const extraScore = bestExtra?.score ?? 0;
  const routeScore = Math.max(sectionScore, extraScore);

  let navigation: AgentNavigation | undefined;
  let text: string;

  if (routeScore >= ROUTE_THRESHOLD) {
    const useExtra = extraScore > sectionScore;
    const route = useExtra ? bestExtra!.path : bestSection!.slug;
    const label = useExtra
      ? (extraRouteLabels[locale][route] ?? extraRouteLabels.en[route] ?? route)
      : sectionLabels[locale][bestSection!.slug];

    if (route === currentRoute) {
      // Don't promise a trip the visitor is already at the end of.
      text = copy.alreadyHere[locale].replace("{section}", label);
    } else {
      text = copy.routed[locale].replace("{section}", label);
      navigation = {
        route,
        href: buildHref(locale, route),
        label,
        reason: label
      };
    }
  } else if (docMatch) {
    text = copy.docs[locale];
  } else {
    text = copy.offline[locale];
  }

  if (docMatch) {
    links.push({label: docMatch.topic.doc.title, url: docMatch.topic.doc.url});
  }

  if (links.length === 0 && !navigation) {
    links.push({label: copy.discordLabel[locale], url: DISCORD_URL});
    links.push({label: copy.docsLabel[locale], url: DOCS_ROOT_URL});
  }

  return {text, navigation, links};
}
