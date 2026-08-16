import type {AppLocale} from "@/i18n/request";
import {hubSections, type HubSectionSlug} from "@/lib/hub-navigation";
import {
  DISCORD_URL,
  DOCS_ROOT_URL,
  buildHref,
  extraRoutes,
  hubSectionMap
} from "@/lib/agent/hub-map";
import {
  matchCoreKnowledge,
  normalizeKnowledgeText
} from "@/lib/agent/standx-knowledge";
import {docAliases, findDoc, type DocEntry} from "@/lib/agent/standx-knowledge";
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
  kind: "knowledge" | "navigation" | "docs" | "fallback";
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
  unknown: {
    en: "I do not have a verified answer for that yet. I would rather point you to the official sources than guess.",
    es: "Todavía no tengo una respuesta verificada para eso. Prefiero llevarte a las fuentes oficiales antes que adivinar.",
    "pt-br":
      "Ainda não tenho uma resposta verificada para isso. Prefiro indicar as fontes oficiais a inventar uma resposta.",
    uk: "Я ще не маю перевіреної відповіді на це. Краще спрямую вас до офіційних джерел, ніж здогадуватимусь.",
    ko: "아직 검증된 답변이 없습니다. 추측하기보다 공식 출처를 안내해 드릴게요."
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

/** Navigation is an action, so a topic keyword alone must never trigger it. */
const navigationIntents: Record<AppLocale, readonly string[]> = {
  en: ["take me", "go to", "open the", "where is", "where can i find", "show me the page"],
  es: ["llevame", "ve a", "ir a", "abre", "donde esta", "donde encuentro", "muestrame la pagina"],
  "pt-br": ["me leve", "va para", "ir para", "abra", "onde fica", "onde encontro", "mostre a pagina"],
  uk: ["переведи мене", "перейди до", "відкрий", "де знаходиться", "де знайти", "покажи сторінку"],
  ko: ["이동해", "가 줘", "열어", "어디에", "어디서 찾", "페이지 보여"]
};

/**
 * Doc topics the fallback can resolve without a model.
 *
 * Built from the shared `docAliases` table rather than a private copy, because
 * these terms are the same bridge the model path needs to find a page from a
 * question asked in Spanish or Korean. When the two lists were separate, only
 * this one had the terms — so the offline brain could route "liquidación" to
 * the right page and the model, which is supposed to be the better path, could
 * not. `findDoc` throws on an unknown title, so a renamed page fails at module
 * load rather than quietly dropping a term.
 */
const docTopics: Array<{terms: readonly string[]; doc: DocEntry}> = docAliases.map(
  (alias) => ({terms: alias.terms, doc: findDoc(alias.title)})
);


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
    const needle = normalizeKnowledgeText(term);
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
  const rawQuestion = lastUserMessage(messages);
  const question = normalizeKnowledgeText(rawQuestion);
  const links: AgentLink[] = [];

  if (!question) {
    return {text: copy.unknown[locale], links, kind: "fallback"};
  }

  const knowledgeMatch = matchCoreKnowledge(rawQuestion, locale);
  const navigationRequested = navigationIntents[locale].some((intent) =>
    question.includes(normalizeKnowledgeText(intent))
  );

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

  let kind: LocalAnswer["kind"];

  if (navigationRequested && routeScore >= ROUTE_THRESHOLD) {
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
    kind = "navigation";
  } else if (knowledgeMatch) {
    text = knowledgeMatch.topic.answer[locale];
    kind = "knowledge";
    for (const title of knowledgeMatch.topic.docTitles.slice(0, 2)) {
      const doc = findDoc(title);
      links.push({label: doc.title, url: doc.url});
    }
  } else if (docMatch) {
    text = copy.docs[locale];
    kind = "docs";
  } else {
    text = copy.unknown[locale];
    kind = "fallback";
  }

  if (docMatch && links.length === 0) {
    links.push({label: docMatch.topic.doc.title, url: docMatch.topic.doc.url});
  }

  if (links.length === 0 && !navigation) {
    links.push({label: copy.discordLabel[locale], url: DISCORD_URL});
    links.push({label: copy.docsLabel[locale], url: DOCS_ROOT_URL});
  }

  return {text, navigation, links, kind};
}
