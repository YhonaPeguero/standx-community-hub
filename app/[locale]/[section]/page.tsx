import Link from "next/link";
import type {Metadata} from "next";
import {ArrowUpRight, ExternalLink} from "lucide-react";
import {notFound} from "next/navigation";
import {
  getHubNavItems,
  hubSections,
  isHubSectionSlug,
  type HubSectionSlug
} from "@/lib/hub-navigation";
import {
  defaultLocale,
  isAppLocale,
  locales,
  type AppLocale
} from "@/i18n/request";

interface SectionPageProps {
  params: {
    locale: string;
    section: string;
  };
}

type LocalizedValue = Record<AppLocale, string>;

interface SectionHeader {
  title: LocalizedValue;
  subtitle: LocalizedValue;
  notice?: LocalizedValue;
}

interface LocalizedItem {
  title: LocalizedValue;
  description: LocalizedValue;
}

interface BrandKitItem {
  eyebrow: LocalizedValue;
  title: LocalizedValue;
  body: LocalizedValue;
  link: string;
}

interface TemplateBlock {
  title: LocalizedValue;
  body: string;
}

interface ReferenceItem {
  type: LocalizedValue;
  title: string;
  excerpt: LocalizedValue;
  link: string;
}

interface CreatorItem {
  name: string;
  handle: string;
  link: string;
  squad: LocalizedValue;
  bio: LocalizedValue;
}

interface InsightItem {
  title: string;
  author: string;
  link: string;
  category: string;
}

function lv(
  en: string,
  es: string,
  ptBr: string,
  uk: string,
  ko: string
): LocalizedValue {
  return {
    en,
    es,
    "pt-br": ptBr,
    uk,
    ko
  };
}

function localized(locale: AppLocale, value: LocalizedValue): string {
  return value[locale];
}

const sectionHeaders: Record<HubSectionSlug, SectionHeader> = {
  "getting-started": {
    title: lv(
      "How to Get Started on StandX",
      "Cómo empezar en StandX",
      "Como começar na StandX",
      "Як почати в StandX",
      "StandX 시작 가이드"
    ),
    subtitle: lv(
      "A guide for traders, creators, researchers, and curious contributors",
      "Una guía para traders, creadores, investigadores y contribuidores curiosos",
      "Um guia para traders, criadores, pesquisadores e contribuidores curiosos",
      "Гайд для трейдерів, креаторів, дослідників і всіх, хто хоче долучитись",
      "트레이더, 크리에이터, 리서처, 그리고 기여를 원하는 모든 분들을 위한 가이드"
    ),
    notice: lv(
      "This hub is for everyone. No matter your background, you can find a clear path to join and contribute.",
      "Este hub es para todos. Sin importar tu perfil, aquí tienes una ruta clara para unirte y contribuir.",
      "Este hub é para todos. Não importa seu perfil, aqui você encontra um caminho claro para participar e contribuir.",
      "Цей хаб для всіх. Незалежно від досвіду, тут є зрозумілий шлях для участі та внеску.",
      "이 허브는 모두를 위한 공간입니다. 배경과 상관없이 참여하고 기여할 수 있는 명확한 경로를 찾을 수 있습니다."
    )
  },
  "brand-kit": {
    title: lv("Brand Kit", "Brand Kit", "Brand Kit", "Brand Kit", "브랜드 키트"),
    subtitle: lv(
      "Visual assets that remove creative friction and help contributors publish faster",
      "Assets visuales para reducir fricción creativa y publicar más rápido",
      "Assets visuais para reduzir fricção criativa e publicar mais rápido",
      "Візуальні ресурси, що зменшують творче тертя та прискорюють публікацію",
      "창작 마찰을 줄이고 더 빠르게 게시할 수 있게 돕는 시각 자료"
    ),
    notice: lv(
      "You focus on content quality. The visual base is already prepared.",
      "Tú te enfocas en la calidad del contenido. La base visual ya está lista.",
      "Você foca na qualidade do conteúdo. A base visual já está pronta.",
      "Ви фокусуєтесь на якості контенту, а візуальна база вже готова.",
      "콘텐츠 품질에 집중하세요. 시각 자료 기반은 이미 준비되어 있습니다."
    )
  },
  templates: {
    title: lv(
      "Content Templates",
      "Plantillas de contenido",
      "Templates de conteúdo",
      "Шаблони контенту",
      "콘텐츠 템플릿"
    ),
    subtitle: lv(
      "Ready structures you can adapt to your own style and voice",
      "Estructuras listas para adaptar a tu propio estilo y voz",
      "Estruturas prontas para adaptar ao seu estilo e voz",
      "Готові структури, які легко адаптувати під ваш стиль",
      "당신의 스타일과 톤에 맞게 바로 활용할 수 있는 구조"
    ),
    notice: lv(
      "Use these templates as skeletons: replace placeholders, keep structure, and publish with consistency.",
      "Usa estas plantillas como esqueleto: reemplaza campos, mantén la estructura y publica con consistencia.",
      "Use estes templates como esqueleto: substitua campos, mantenha a estrutura e publique com consistência.",
      "Використовуйте шаблони як каркас: замінюйте поля, тримайте структуру та публікуйте стабільно.",
      "템플릿은 뼈대입니다. 필드만 교체하고 구조를 유지해 일관성 있게 발행하세요."
    )
  },
  references: {
    title: lv(
      "Real References",
      "Referencias reales",
      "Referências reais",
      "Реальні приклади",
      "실제 레퍼런스"
    ),
    subtitle: lv(
      "Examples of real content created for the StandX ecosystem",
      "Ejemplos de contenido real creado para el ecosistema StandX",
      "Exemplos reais de conteúdo criado para o ecossistema StandX",
      "Приклади реального контенту, створеного для екосистеми StandX",
      "StandX 생태계를 위해 실제로 제작된 콘텐츠 예시"
    ),
    notice: lv(
      "Different formats, languages, and approaches. This shows the practical range of contribution.",
      "Formatos, idiomas y enfoques distintos. Esto muestra el rango práctico de contribución.",
      "Formatos, línguas e abordagens diferentes. Isso mostra o alcance prático da contribuição.",
      "Різні формати, мови та підходи. Це показує практичний діапазон внеску.",
      "다양한 형식, 언어, 접근 방식. 실제 기여 범위를 보여줍니다."
    )
  },
  community: {
    title: lv("Community", "Comunidad", "Comunidade", "Спільнота", "커뮤니티"),
    subtitle: lv(
      "Where everything happens and who is building together",
      "Dónde sucede todo y quiénes están construyendo juntos",
      "Onde tudo acontece e quem está construindo junto",
      "Де все відбувається і хто будує разом",
      "모든 활동이 일어나는 곳, 그리고 함께 만드는 사람들"
    ),
    notice: lv(
      "This section keeps the original spirit: direct Discord access, community projects, and creator recognition.",
      "Esta sección mantiene el espíritu original: acceso directo a Discord, proyectos comunitarios y reconocimiento de creadores.",
      "Esta seção preserva o espírito original: acesso direto ao Discord, projetos da comunidade e reconhecimento de criadores.",
      "Цей розділ зберігає оригінальну суть: прямий доступ до Discord, community projects і визнання креаторів.",
      "이 섹션은 원래의 핵심을 유지합니다: Discord 진입, 커뮤니티 프로젝트, 크리에이터 인정."
    )
  },
  "standers-insights": {
    title: lv(
      "Standers Insights",
      "Standers Insights",
      "Standers Insights",
      "Standers Insights",
      "Standers Insights"
    ),
    subtitle: lv(
      "Curated analysis from active community contributors",
      "Análisis curado por contribuidores activos de la comunidad",
      "Análises curadas por contribuidores ativos da comunidade",
      "Кураторська аналітика від активних учасників спільноти",
      "활동적인 커뮤니티 기여자들이 큐레이션한 분석"
    ),
    notice: lv(
      "Articles are community-made and editorially reviewed before being highlighted.",
      "Los artículos son creados por la comunidad y revisados editorialmente antes de destacarse.",
      "Os artigos são feitos pela comunidade e revisados editorialmente antes de serem destacados.",
      "Статті створюються спільнотою та проходять редакційний огляд перед публікацією.",
      "아티클은 커뮤니티가 작성하고, 노출 전 편집 검토를 거칩니다."
    )
  },
  about: {
    title: lv("About", "Acerca de", "Sobre", "Про хаб", "소개"),
    subtitle: lv(
      "Who built this hub, why it exists, and how the community initiative continues",
      "Quién construyó este hub, por qué existe y cómo continúa la iniciativa comunitaria",
      "Quem construiu este hub, por que ele existe e como a iniciativa comunitária continua",
      "Хто створив цей хаб, чому він існує та як продовжується ініціатива",
      "이 허브를 만든 사람, 존재 이유, 그리고 커뮤니티 이니셔티브의 연속성"
    ),
    notice: lv(
      "Built on the original community initiative by @TARZANWEB3 and redesigned as an upgraded hub experience.",
      "Construido sobre la iniciativa comunitaria original de @TARZANWEB3 y rediseñado como una experiencia mejorada.",
      "Construído sobre a iniciativa comunitária original de @TARZANWEB3 e redesenhado como uma experiência aprimorada.",
      "Створено на основі оригінальної ініціативи @TARZANWEB3 та оновлено як сучасний хаб.",
      "@TARZANWEB3의 원래 커뮤니티 이니셔티브를 기반으로 업그레이드된 허브 경험으로 재설계되었습니다."
    )
  }
};

const uiCopy = {
  home: lv("Home", "Inicio", "Início", "Головна", "홈"),
  joinDiscord: lv(
    "Join Discord",
    "Unirse a Discord",
    "Entrar no Discord",
    "Приєднатися до Discord",
    "Discord 참여"
  ),
  openDocumentation: lv(
    "Open full documentation",
    "Abrir documentación completa",
    "Abrir documentação completa",
    "Відкрити повну документацію",
    "전체 문서 열기"
  ),
  openDrive: lv("Open Drive", "Abrir Drive", "Abrir Drive", "Відкрити Drive", "Drive 열기"),
  openRootFolder: lv(
    "Open root Drive folder",
    "Abrir carpeta raíz de Drive",
    "Abrir pasta raiz no Drive",
    "Відкрити кореневу папку Drive",
    "루트 Drive 폴더 열기"
  ),
  openReference: lv(
    "Open reference",
    "Abrir referencia",
    "Abrir referência",
    "Відкрити приклад",
    "레퍼런스 열기"
  ),
  playNow: lv("Play now", "Jugar ahora", "Jogar agora", "Грати зараз", "지금 플레이"),
  openNotion: lv(
    "Open on Notion",
    "Abrir en Notion",
    "Abrir no Notion",
    "Відкрити в Notion",
    "Notion에서 열기"
  ),
  openArticle: lv(
    "Open article",
    "Abrir artículo",
    "Abrir artigo",
    "Відкрити статтю",
    "아티클 열기"
  ),
  openXProfile: lv(
    "Open X profile",
    "Abrir perfil en X",
    "Abrir perfil no X",
    "Відкрити профіль X",
    "X 프로필 열기"
  ),
  exploreSIPs: lv(
    "Explore SIPs",
    "Explorar SIPs",
    "Explorar SIPs",
    "Переглянути SIP",
    "SIP 탐색"
  )
};

const gettingStartedCopy = {
  growthPathLabel: lv("Growth Path", "Growth Path", "Growth Path", "Growth Path", "Growth Path"),
  growthPathBody: lv(
    "The StandX Growth Path is the community progression system and everything happens in the official Discord. It values different profiles, from content creators to researchers, support members, and local builders.",
    "El Growth Path de StandX es el sistema de progresión comunitaria y todo ocurre en el Discord oficial. Valora perfiles diferentes, desde creadores de contenido hasta investigadores, soporte y builders locales.",
    "O Growth Path da StandX é o sistema de progressão da comunidade e tudo acontece no Discord oficial. Ele valoriza perfis diferentes, de criadores de conteúdo a pesquisadores, suporte e builders locais.",
    "Growth Path у StandX — це система прогресу спільноти, і все відбувається в офіційному Discord. Вона цінує різні профілі: від контент-креаторів до дослідників, сапорту та локальних ініціаторів.",
    "StandX Growth Path는 커뮤니티 성장 시스템이며 모든 진행은 공식 Discord에서 이루어집니다. 콘텐츠 크리에이터, 리서처, 서포트, 로컬 빌더 등 다양한 기여 유형을 인정합니다."
  ),
  stepByStepTitle: lv("Step by step", "Paso a paso", "Passo a passo", "Крок за кроком", "단계별 진행"),
  squadsTitle: lv("Squads", "Squads", "Squads", "Squads", "Squads"),
  squadsNotice: lv(
    "Choose based on what you enjoy doing. The best squad is the one that keeps you active and consistent.",
    "Elige según lo que disfrutas hacer. El mejor squad es el que te mantiene activo y constante.",
    "Escolha com base no que você gosta de fazer. O melhor squad é o que te mantém ativo e consistente.",
    "Обирайте те, що вам справді подобається. Найкращий squad — той, що допомагає тримати стабільну активність.",
    "좋아하는 작업을 기준으로 선택하세요. 가장 좋은 squad는 꾸준히 활동할 수 있게 해주는 팀입니다."
  ),
  sproutTitle: lv("SPROUT Criteria", "Criterios para SPROUT", "Critérios para SPROUT", "Критерії SPROUT", "SPROUT 기준"),
  sproutLead: lv(
    "Engage ≥ 4,000 plus consistent activity and quality delivery in your squad.",
    "Engage ≥ 4,000 más actividad constante y calidad de entrega en tu squad.",
    "Engage ≥ 4,000 mais atividade consistente e qualidade de entrega no seu squad.",
    "Engage ≥ 4,000 плюс стабільна активність і якісний результат у вашому squad.",
    "Engage ≥ 4,000과 함께 꾸준한 활동 및 squad 내 결과물 품질이 필요합니다."
  )
};

const growthSteps: LocalizedItem[] = [
  {
    title: lv(
      "1) Accumulate 3,000 Engage Points",
      "1) Acumula 3,000 Engage Points",
      "1) Acumule 3,000 Engage Points",
      "1) Наберіть 3,000 Engage Points",
      "1) Engage Points 3,000점 달성"
    ),
    description: lv(
      "Join weekly events, react to announcements, and create content on X. Share links in #content-creation to accumulate points.",
      "Participa en eventos semanales, reacciona a anuncios y crea contenido en X. Comparte enlaces en #content-creation para sumar puntos.",
      "Participe de eventos semanais, reaja aos anúncios e crie conteúdo no X. Compartilhe links em #content-creation para acumular pontos.",
      "Долучайтесь до щотижневих подій, реагуйте на анонси та створюйте контент у X. Діліться лінками в #content-creation, щоб набирати бали.",
      "주간 이벤트 참여, 공지 반응, X 콘텐츠 제작을 진행하세요. #content-creation에 링크를 공유해 포인트를 쌓습니다."
    )
  },
  {
    title: lv(
      "2) Apply for @SEED",
      "2) Postula para @SEED",
      "2) Aplique para @SEED",
      "2) Подайте заявку на @SEED",
      "2) @SEED 신청"
    ),
    description: lv(
      "After obtaining @Stander, apply in #seed-application. If not accepted, improve activity and reapply later.",
      "Después de obtener @Stander, aplica en #seed-application. Si no te aceptan, mejora la actividad y vuelve a aplicar.",
      "Depois de obter @Stander, aplique em #seed-application. Se não for aceito, melhore sua atividade e reaplique.",
      "Після отримання @Stander подайте заявку в #seed-application. Якщо не прийняли, покращуйте активність і подавайтеся знову.",
      "@Stander 획득 후 #seed-application에서 신청하세요. 미승인 시 활동을 강화해 다시 신청하면 됩니다."
    )
  },
  {
    title: lv(
      "3) Choose your Squad",
      "3) Elige tu Squad",
      "3) Escolha seu Squad",
      "3) Оберіть свій Squad",
      "3) Squad 선택"
    ),
    description: lv(
      "Open a ticket in #support-ticket and choose the squad that best matches your strengths.",
      "Abre un ticket en #support-ticket y elige el squad que mejor encaja con tus fortalezas.",
      "Abra um ticket em #support-ticket e escolha o squad que melhor combina com seus pontos fortes.",
      "Відкрийте тікет у #support-ticket та оберіть squad, який найкраще відповідає вашим сильним сторонам.",
      "#support-ticket에서 티켓을 열고 자신의 강점에 맞는 squad를 선택하세요."
    )
  },
  {
    title: lv(
      "4) Complete tasks and level up to @SPROUT",
      "4) Completa tareas y sube a @SPROUT",
      "4) Complete tarefas e suba para @SPROUT",
      "4) Виконуйте задачі та переходьте до @SPROUT",
      "4) 과제를 완료하고 @SPROUT로 승급"
    ),
    description: lv(
      "Tasks are posted in #task-board and submitted in #task-submission. Moderators also evaluate consistency.",
      "Las tareas se publican en #task-board y se entregan en #task-submission. Los moderadores también evalúan constancia.",
      "As tarefas são publicadas em #task-board e enviadas em #task-submission. Moderadores também avaliam consistência.",
      "Завдання публікуються в #task-board, а здача відбувається в #task-submission. Модератори також оцінюють стабільність участі.",
      "과제는 #task-board에 게시되고 #task-submission에 제출합니다. 운영진은 꾸준함도 함께 평가합니다."
    )
  },
  {
    title: lv(
      "5) Reach @FLOWER",
      "5) Llega a @FLOWER",
      "5) Alcance @FLOWER",
      "5) Досягніть @FLOWER",
      "5) @FLOWER 달성"
    ),
    description: lv(
      "Reserved for members who lead initiatives and raise standards with proactive work.",
      "Reservado para miembros que lideran iniciativas y elevan el nivel con trabajo proactivo.",
      "Reservado para membros que lideram iniciativas e elevam o nível com trabalho proativo.",
      "Рівень для учасників, які ведуть ініціативи та підвищують стандарти через проактивну роботу.",
      "주도적으로 이니셔티브를 이끌고 기준을 끌어올리는 멤버를 위한 단계입니다."
    )
  }
];

const squadItems: LocalizedItem[] = [
  {
    title: lv(
      "Content / Research",
      "Content / Research",
      "Content / Research",
      "Content / Research",
      "Content / Research"
    ),
    description: lv(
      "Articles, tutorials, FAQs, market analysis, and educational breakdowns.",
      "Artículos, tutoriales, FAQ, análisis de mercado y desgloses educativos.",
      "Artigos, tutoriais, FAQ, análises de mercado e materiais educativos.",
      "Статті, туторіали, FAQ, ринкова аналітика та освітні розбори.",
      "아티클, 튜토리얼, FAQ, 시장 분석, 교육형 해설 콘텐츠를 담당합니다."
    )
  },
  {
    title: lv("Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad"),
    description: lv(
      "Posters, stickers, videos, and visual assets used by the community.",
      "Pósters, stickers, videos y assets visuales usados por la comunidad.",
      "Pôsteres, stickers, vídeos e assets visuais usados pela comunidade.",
      "Постери, стікери, відео та візуальні ресурси для спільноти.",
      "포스터, 스티커, 영상 등 커뮤니티에서 사용하는 시각 자산을 만듭니다."
    )
  },
  {
    title: lv(
      "Tech Support Squad",
      "Tech Support Squad",
      "Tech Support Squad",
      "Tech Support Squad",
      "Tech Support Squad"
    ),
    description: lv(
      "Technical support, onboarding help, and complete product tutorials.",
      "Soporte técnico, ayuda de onboarding y tutoriales completos del producto.",
      "Suporte técnico, ajuda de onboarding e tutoriais completos do produto.",
      "Технічний сапорт, допомога з онбордингом та повні туторіали по продукту.",
      "기술 지원, 온보딩 도움, 제품 사용 튜토리얼을 담당합니다."
    )
  },
  {
    title: lv("Outreach Squad", "Outreach Squad", "Outreach Squad", "Outreach Squad", "Outreach Squad"),
    description: lv(
      "Local KOL outreach, partner communities, and collaboration channels.",
      "Relación con KOL locales, comunidades aliadas y canales de colaboración.",
      "Relacionamento com KOLs locais, comunidades parceiras e canais de colaboração.",
      "Робота з локальними KOL, партнерськими спільнотами та каналами співпраці.",
      "로컬 KOL 및 파트너 커뮤니티와의 협업 채널을 확장합니다."
    )
  },
  {
    title: lv("Offline Squad", "Offline Squad", "Offline Squad", "Offline Squad", "Offline Squad"),
    description: lv(
      "Meetups, local operations, and ambassador-led community presence.",
      "Meetups, operaciones locales y presencia comunitaria liderada por embajadores.",
      "Meetups, operações locais e presença comunitária liderada por embaixadores.",
      "Міт-апи, локальні активності та розвиток присутності через амбасадорів.",
      "밋업, 로컬 운영, 앰배서더 중심의 오프라인 커뮤니티 활동을 이끕니다."
    )
  }
];

const sproutCriteria: LocalizedValue[] = [
  lv(
    "Content / Research: 2 approved in-depth pieces",
    "Content / Research: 2 piezas profundas aprobadas",
    "Content / Research: 2 peças aprofundadas aprovadas",
    "Content / Research: 2 затверджені поглиблені матеріали",
    "Content / Research: 승인된 심화 콘텐츠 2개"
  ),
  lv(
    "Creative: 4 visuals or videos adopted by community",
    "Creative: 4 visuales o videos adoptados por la comunidad",
    "Creative: 4 visuais ou vídeos adotados pela comunidade",
    "Creative: 4 візуальні матеріали або відео, які використала спільнота",
    "Creative: 커뮤니티가 채택한 비주얼/영상 4개"
  ),
  lv(
    "Tech Support: 25 solved questions plus 1 full tutorial",
    "Tech Support: 25 preguntas resueltas más 1 tutorial completo",
    "Tech Support: 25 dúvidas resolvidas mais 1 tutorial completo",
    "Tech Support: 25 вирішених запитань плюс 1 повний туторіал",
    "Tech Support: 해결 질문 25건 + 전체 튜토리얼 1개"
  ),
  lv(
    "Outreach: 3 local KOL or community activations",
    "Outreach: 3 activaciones con KOL o comunidades locales",
    "Outreach: 3 ativações com KOLs ou comunidades locais",
    "Outreach: 3 активації з локальними KOL або спільнотами",
    "Outreach: 로컬 KOL/커뮤니티 활성화 3건"
  ),
  lv(
    "Offline: 2 events (100+ participants total) plus 1 report",
    "Offline: 2 eventos (100+ participantes en total) más 1 reporte",
    "Offline: 2 eventos (100+ participantes no total) mais 1 relatório",
    "Offline: 2 події (100+ учасників загалом) плюс 1 звіт",
    "Offline: 오프라인 이벤트 2회(총 100명+) + 보고서 1개"
  )
];

const brandKitCopy = {
  rootTitle: lv(
    "Full Kit (Root Folder)",
    "Kit completo (carpeta raíz)",
    "Kit completo (pasta raiz)",
    "Повний набір (коренева папка)",
    "풀 키트 (루트 폴더)"
  ),
  rootBody: lv(
    "All categories in one location when you need complete browsing or bulk download.",
    "Todas las categorías en un solo lugar cuando necesitas navegar todo o descargar por lote.",
    "Todas as categorias em um único lugar quando você precisa navegar tudo ou baixar em lote.",
    "Усі категорії в одному місці, коли потрібен повний перегляд або масове завантаження.",
    "전체 카테고리를 한 곳에서 확인하고 일괄 다운로드할 수 있습니다."
  ),
  warning: lv(
    "Assets are community-created and do not represent official StandX communication. Do not use them to simulate official announcements.",
    "Los assets son creados por la comunidad y no representan comunicación oficial de StandX. No los uses para simular anuncios oficiales.",
    "Os assets são criados pela comunidade e não representam comunicação oficial da StandX. Não os use para simular anúncios oficiais.",
    "Ці матеріали створені спільнотою і не є офіційною комунікацією StandX. Не використовуйте їх для імітації офіційних анонсів.",
    "이 자료는 커뮤니티 제작물이며 StandX 공식 커뮤니케이션이 아닙니다. 공식 공지를 가장하는 용도로 사용하지 마세요."
  )
};

const brandKitItems: BrandKitItem[] = [
  {
    eyebrow: lv(
      "Modular · Transparent",
      "Modular · Transparente",
      "Modular · Transparente",
      "Модульні · Прозорі",
      "모듈형 · 투명 배경"
    ),
    title: lv(
      "Mascot Assets (Base)",
      "Assets de mascota (base)",
      "Assets de mascote (base)",
      "Ресурси маскота (база)",
      "마스코트 에셋 (베이스)"
    ),
    body: lv(
      "Full-body, half-body, head-only, and utility poses in PNG format. Ideal for custom compositions.",
      "Full-body, half-body, solo cabeza y poses funcionales en PNG. Ideal para composiciones personalizadas.",
      "Full-body, half-body, só cabeça e poses funcionais em PNG. Ideal para composições personalizadas.",
      "Повний зріст, половина, лише голова та службові пози у PNG. Ідеально для власних композицій.",
      "전신/반신/헤드 전용/유틸 포즈 PNG로 제공되며 커스텀 합성에 적합합니다."
    ),
    link: "https://drive.google.com/drive/folders/1ToCqBkjKhASrsp6_ZmK2BbqwLXpmXpww?usp=drive_link"
  },
  {
    eyebrow: lv(
      "Reaction · Quick expression",
      "Reacción · Expresión rápida",
      "Reação · Expressão rápida",
      "Реакції · Швидкі емоції",
      "리액션 · 빠른 감정 표현"
    ),
    title: lv(
      "Emotions & Reactions",
      "Emociones y reacciones",
      "Emoções e reações",
      "Емоції та реакції",
      "감정 & 리액션"
    ),
    body: lv(
      "Quick emotion packs including Bullish, Bearish, GG, Loss, Alert, and Idea variants.",
      "Packs de emociones rápidas con variantes Bullish, Bearish, GG, Loss, Alert e Idea.",
      "Packs de emoções rápidas com variantes Bullish, Bearish, GG, Loss, Alert e Idea.",
      "Швидкі набори емоцій із варіантами Bullish, Bearish, GG, Loss, Alert та Idea.",
      "Bullish, Bearish, GG, Loss, Alert, Idea 등 빠른 반응용 감정 세트를 제공합니다."
    ),
    link: "https://drive.google.com/drive/folders/1iO8iKhDP_QJAWZ1az3PPUevsGl-HabBX?usp=drive_link"
  },
  {
    eyebrow: lv(
      "Storytelling · Visual education",
      "Storytelling · Educación visual",
      "Storytelling · Educação visual",
      "Сторітелінг · Візуальна освіта",
      "스토리텔링 · 비주얼 교육"
    ),
    title: lv(
      "Mascot Scenes & Illustrations",
      "Escenas e ilustraciones de mascota",
      "Cenas e ilustrações de mascote",
      "Сцени та ілюстрації з маскотом",
      "마스코트 씬 & 일러스트"
    ),
    body: lv(
      "Complete non-modular illustrations for long educational narratives and conceptual content.",
      "Ilustraciones completas no modulares para narrativas educativas largas y contenido conceptual.",
      "Ilustrações completas não modulares para narrativas educativas longas e conteúdo conceitual.",
      "Повні немодульні ілюстрації для довгих освітніх матеріалів і концептуального контенту.",
      "장문 교육형 스토리와 콘셉트 콘텐츠에 적합한 완성형 일러스트 세트입니다."
    ),
    link: "https://drive.google.com/drive/folders/1lXJ2A_tSld00dq4eP50n1g55eVLwpG3D?usp=drive_link"
  },
  {
    eyebrow: lv("Ready to post", "Listo para publicar", "Pronto para publicar", "Готово до публікації", "즉시 게시"),
    title: lv(
      "Marketing Support Assets",
      "Assets de soporte de marketing",
      "Assets de suporte de marketing",
      "Маркетингові допоміжні матеріали",
      "마케팅 지원 에셋"
    ),
    body: lv(
      "Final assets with composition and background ready for immediate social publication.",
      "Assets finales con composición y fondo listos para publicar de inmediato.",
      "Assets finais com composição e fundo prontos para publicar imediatamente.",
      "Готові матеріали з композицією та фоном для швидкої публікації в соцмережах.",
      "구도와 배경이 완성된 최종 에셋으로 바로 소셜 게시가 가능합니다."
    ),
    link: "https://drive.google.com/drive/folders/13cLiJ2XjHvHLzx_44ZVqI4tNPFVJqN0m?usp=drive_link"
  }
];

const rootKitLink =
  "https://drive.google.com/drive/folders/1XQbI-u8HCbYtkBHw4VX7QDvduEBu1Wzw?usp=drive_link";

const templatesNotice = lv(
  "Templates are skeletons. Replace placeholders, keep structure, and adapt tone to your own style.",
  "Las plantillas son esqueletos. Reemplaza campos, conserva la estructura y adapta el tono a tu estilo.",
  "Templates são esqueletos. Substitua campos, mantenha a estrutura e adapte o tom ao seu estilo.",
  "Шаблони — це каркас. Замінюйте поля, зберігайте структуру та адаптуйте тон під свій стиль.",
  "템플릿은 골격입니다. 자리표시자를 바꾸고 구조를 유지한 채 본인 톤으로 조정하세요."
);

const templateBlocks: TemplateBlock[] = [
  {
    title: lv(
      "Educational Article",
      "Articulo educativo",
      "Artigo educativo",
      "Освітня стаття",
      "교육형 아티클"
    ),
    body: `[TITLE]\n\n[CONTEXT - why this matters for StandX traders]\n1 direct paragraph, no generic intro.\n\n---\n\n[MAIN CONCEPT - explained simply]\nNo unnecessary jargon.\n\n---\n\n[HOW IT WORKS IN PRACTICE]\nUse one real or hypothetical scenario.\n\n---\n\n[COMMON MISTAKE]\nWhat most people misunderstand.\n\n---\n\n[CONCLUSION]\nClose with insight, not platform praise.`
  },
  {
    title: lv(
      "X Thread (Bilingual)",
      "Hilo de X (bilingue)",
      "Thread no X (bilingue)",
      "X-тред (двомовний)",
      "X 스레드 (이중 언어)"
    ),
    body: `1/ [HOOK]\n2/ [CONTEXT]\n3/ [MECHANISM]\n4/ [IMPLICATION]\n5/ [CONCLUSION]\n\n---\nPT-BR:\n[Portuguese version]`
  },
  {
    title: lv(
      "Monthly Competitive Radar",
      "Radar competitivo mensual",
      "Radar competitivo mensal",
      "Щомісячний конкурентний радар",
      "월간 경쟁 레이더"
    ),
    body: `COMPETITIVE RADAR - [MONTH/YEAR]\n\n[PLATFORM 1] -> [Change] -> [Practical impact]\n[PLATFORM 2] -> [Change] -> [Practical impact]\n[PLATFORM 3] -> [Change] -> [Practical impact]\n\nWHERE STANDX STANDS\n[Neutral analysis]\n\nMONTHLY TAKEAWAY\n[What a trader should know now]`
  },
  {
    title: lv("Glossary Entry", "Entrada de glosario", "Entrada de glossario", "Елемент глосарію", "용어집 항목"),
    body: `[TERM]\n\nSimple definition:\n[1 sentence]\n\nHow it works:\n[2-3 sentences]\n\nIn StandX context:\n[Where this appears]\n\nExample:\n[Practical scenario]\n\nDo not confuse with:\n[Related confusing term]`
  }
];

const referenceItems: ReferenceItem[] = [
  {
    type: lv(
      "Article · X Articles · EN",
      "Artículo · X Articles · EN",
      "Artigo · X Articles · EN",
      "Стаття · X Articles · EN",
      "아티클 · X Articles · EN"
    ),
    title: "Why StandX? The structural answer for traders who take execution seriously",
    excerpt: lv(
      "Most perp platforms answer one question the wrong way: what happens to your capital when you are not in a position? StandX starts from a different premise.",
      "La mayoría de las plataformas perp responde mal una pregunta: ¿qué pasa con tu capital cuando no tienes posición? StandX parte de otra premisa.",
      "A maioria das plataformas perp responde errado à mesma pergunta: o que acontece com seu capital quando você não está posicionado? A StandX parte de outra premissa.",
      "Більшість perp-платформ неправильно відповідають на одне питання: що з вашим капіталом, коли ви поза позицією? StandX стартує з іншої логіки.",
      "대부분의 perp 플랫폼은 포지션이 없을 때 자본이 어떻게 되는지에 대한 질문에 잘못 답합니다. StandX는 다른 전제에서 출발합니다."
    ),
    link: "https://x.com/victordesouza96/status/2034354336025690256"
  },
  {
    type: lv(
      "Manual Creation · Hand Painting",
      "Creación manual · Pintura a mano",
      "Criação manual · Pintura à mão",
      "Ручне створення · Розпис вручну",
      "수작업 제작 · 핸드 페인팅"
    ),
    title: "Stander drawn and painted by hand — from imagination to paper",
    excerpt: lv(
      "A community identity piece that connects visual storytelling with product culture.",
      "Una pieza de identidad comunitaria que conecta storytelling visual con cultura de producto.",
      "Uma peça de identidade comunitária que conecta storytelling visual com cultura de produto.",
      "Матеріал ідентичності спільноти, що поєднує візуальний сторітелінг із культурою продукту.",
      "비주얼 스토리텔링과 제품 문화를 연결한 커뮤니티 아이덴티티 작업입니다."
    ),
    link: "https://x.com/victordesouza96/status/2033978427724771711"
  },
  {
    type: lv(
      "Educational Video · AI Production",
      "Video educativo · Producción con IA",
      "Vídeo educativo · Produção com IA",
      "Освітнє відео · AI-виробництво",
      "교육형 영상 · AI 제작"
    ),
    title: "Technical video content with narration and explanatory captions",
    excerpt: lv(
      "A format that combines technical depth with visual accessibility for broader audiences.",
      "Un formato que combina profundidad técnica con accesibilidad visual para audiencias amplias.",
      "Um formato que combina profundidade técnica com acessibilidade visual para audiências amplas.",
      "Формат, що поєднує технічну глибину та візуальну доступність для ширшої аудиторії.",
      "기술적 깊이와 시각적 접근성을 함께 제공하는 형식입니다."
    ),
    link: "https://x.com/victordesouza96/status/2033601219533344977"
  },
  {
    type: lv(
      "Real World Creation",
      "Creación en el mundo real",
      "Criação no mundo real",
      "Реальне створення",
      "현실 세계 제작"
    ),
    title: "Stander Girl with official StandX shirt in real setting",
    excerpt: lv(
      "A bridge between digital identity and physical-world community expression.",
      "Un puente entre la identidad digital y la expresión comunitaria en el mundo físico.",
      "Uma ponte entre identidade digital e expressão comunitária no mundo físico.",
      "Міст між цифровою ідентичністю та фізичним вираженням спільноти.",
      "디지털 아이덴티티와 오프라인 커뮤니티 표현을 연결한 작업입니다."
    ),
    link: "https://x.com/victordesouza96/status/2023790192625066264"
  },
  {
    type: lv(
      "Live Market Analysis",
      "Análisis de mercado en vivo",
      "Análise de mercado ao vivo",
      "Живий ринковий аналіз",
      "실시간 시장 분석"
    ),
    title: "Market analysis on StandX narrated by the trader",
    excerpt: lv(
      "Execution-focused content directly on platform interface, showing practical use.",
      "Contenido enfocado en la ejecución directamente sobre la interfaz, mostrando uso práctico.",
      "Conteúdo focado em execução diretamente na interface, mostrando uso prático.",
      "Контент, сфокусований на виконанні, прямо в інтерфейсі платформи з практичним застосуванням.",
      "실제 플랫폼 인터페이스에서 실행 중심으로 제작된 실전형 콘텐츠입니다."
    ),
    link: "https://x.com/victordesouza96/status/2023113800002793878"
  },
  {
    type: lv(
      "Community Infrastructure",
      "Infraestructura comunitaria",
      "Infraestrutura comunitária",
      "Community infrastructure",
      "커뮤니티 인프라"
    ),
    title: "StandX Community Brand Kit launch",
    excerpt: lv(
      "A contribution built to remove creative friction and make community publishing easier.",
      "Una contribución creada para quitar fricción creativa y facilitar publicaciones comunitarias.",
      "Uma contribuição criada para remover fricção criativa e facilitar publicações da comunidade.",
      "Внесок, створений для зняття творчого тертя та спрощення публікацій у спільноті.",
      "창작 마찰을 줄이고 커뮤니티 발행을 쉽게 만들기 위해 구축된 기여물입니다."
    ),
    link: "https://x.com/victordesouza96/status/2008660667973120158"
  }
];

const communityCopy = {
  projectLabel: lv("Community project", "Proyecto comunitario", "Projeto comunitário", "Community project", "커뮤니티 프로젝트"),
  projectTitle: lv(
    "StandX Flappy Candle",
    "StandX Flappy Candle",
    "StandX Flappy Candle",
    "StandX Flappy Candle",
    "StandX Flappy Candle"
  ),
  projectDescription: lv(
    "Navigate the market as the StandX mascot, collect DUSD, dodge candles, and climb the global ranking.",
    "Navega el mercado como la mascota de StandX, junta DUSD, esquiva velas y sube en el ranking global.",
    "Navegue pelo mercado como a mascote da StandX, colete DUSD, desvie de candles e suba no ranking global.",
    "Керуйте маскотом StandX, збирайте DUSD, уникайте свічок і піднімайтесь у глобальному рейтингу.",
    "StandX 마스코트로 시장을 탐험하며 DUSD를 모으고 캔들을 피해서 글로벌 랭킹을 올리세요."
  ),
  serverLabel: lv("Official server", "Servidor oficial", "Servidor oficial", "Офіційний сервер", "공식 서버"),
  serverTitle: lv("StandX Discord", "Discord de StandX", "Discord da StandX", "StandX Discord", "StandX Discord"),
  serverDescription: lv(
    "Tasks, events, discussions, and Growth Path progression all happen in Discord.",
    "Las tareas, eventos, discusiones y el progreso del Growth Path suceden en Discord.",
    "Tarefas, eventos, discussões e progresso do Growth Path acontecem no Discord.",
    "Усі задачі, події, дискусії та прогрес Growth Path відбуваються в Discord.",
    "과제, 이벤트, 토론, Growth Path 진행은 모두 Discord에서 이루어집니다."
  ),
  sipGuideLabel: lv("Community resource", "Recurso comunitario", "Recurso comunitário", "Community resource", "커뮤니티 리소스"),
  sipGuideTitle: lv("StandX SIP Visual Guide", "Guía Visual de SIPs", "Guia Visual de SIPs", "Візуальний гайд по SIP", "SIP 비주얼 가이드"),
  sipGuideDescription: lv(
    "A community-driven educational experience designed to make StandX SIPs easier to understand. Visual, interactive, and built to help you grasp each proposal clearly.",
    "Una experiencia educativa impulsada por la comunidad que hace más fácil entender los SIPs de StandX. Visual, interactiva y diseñada para que comprendas cada propuesta con claridad.",
    "Uma experiência educacional criada pela comunidade para tornar os SIPs da StandX mais fáceis de entender. Visual, interativa e feita para você compreender cada proposta com clareza.",
    "Освітній досвід від спільноти, що робить SIP StandX простішими для розуміння. Візуальний, інтерактивний і створений, щоб ви чітко розуміли кожну пропозицію.",
    "StandX SIP를 더 쉽게 이해할 수 있도록 커뮤니티가 만든 교육 경험. 각 제안을 명확하게 파악할 수 있도록 시각적이고 인터랙티브하게 구성되었습니다."
  ),
  creatorsTitle: lv(
    "Creators who inspire",
    "Creadores que inspiran",
    "Criadores que inspiram",
    "Креатори, що надихають",
    "영감을 주는 크리에이터"
  )
};

const creatorItems: CreatorItem[] = [
  {
    name: "Aifilho",
    handle: "@FilhoIsmae",
    link: "https://x.com/FilhoIsmae",
    squad: lv("Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad"),
    bio: lv(
      "Skilled, innovative, and consistently helpful creator who raises visual quality standards.",
      "Creador hábil, innovador y siempre colaborativo que eleva el nivel visual de la comunidad.",
      "Criador habilidoso, inovador e sempre colaborativo que eleva o nível visual da comunidade.",
      "Талановитий, інноваційний і стабільно корисний креатор, який піднімає візуальні стандарти.",
      "실력과 창의성을 갖추고 꾸준히 도움을 주며 커뮤니티의 비주얼 퀄리티 기준을 끌어올리는 크리에이터입니다."
    )
  },
  {
    name: "Jovan",
    handle: "@JovanNeves",
    link: "https://x.com/JovanNeves",
    squad: lv("Content Squad", "Content Squad", "Content Squad", "Content Squad", "Content Squad"),
    bio: lv(
      "Versatile and present contributor who moves across formats with strong execution consistency.",
      "Contribuidor versátil y presente que trabaja en múltiples formatos con ejecución consistente.",
      "Contribuidor versátil e presente que atua em vários formatos com execução consistente.",
      "Універсальний і активний учасник, який стабільно працює в різних форматах.",
      "다양한 포맷을 오가며 꾸준한 실행력을 보여주는 멀티형 기여자입니다."
    )
  },
  {
    name: "Dias",
    handle: "@diaserdropes",
    link: "https://x.com/diaserdropes",
    squad: lv("Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad"),
    bio: lv(
      "Recognized for presence, resilience, and community support inside and outside the server.",
      "Reconocido por presencia, resiliencia y soporte comunitario dentro y fuera del servidor.",
      "Reconhecido por presença, resiliência e suporte comunitário dentro e fora do servidor.",
      "Відомий за активність, стійкість і підтримку спільноти всередині та поза сервером.",
      "서버 안팎에서 꾸준함과 회복력, 커뮤니티 지원으로 인정받는 크리에이터입니다."
    )
  },
  {
    name: "Dan",
    handle: "@DanielAnge9499",
    link: "https://x.com/DanielAnge9499",
    squad: lv("Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad", "Creative Squad"),
    bio: lv(
      "A quality benchmark in visual execution, art direction, and creator discipline.",
      "Un referente de calidad en ejecución visual, dirección de arte y disciplina creativa.",
      "Uma referência de qualidade em execução visual, direção de arte e disciplina criativa.",
      "Еталон якості у візуальному виконанні, артдирекшні та творчій дисципліні.",
      "비주얼 실행력, 아트 디렉션, 작업 규율에서 높은 기준을 보여주는 벤치마크입니다."
    )
  }
];

const insightsCopy = {
  databaseTitle: lv(
    "Full Standers Insights Database",
    "Base completa de Standers Insights",
    "Base completa do Standers Insights",
    "Повна база Standers Insights",
    "Standers Insights 전체 데이터베이스"
  ),
  databaseDescription: lv(
    "Curated community articles and research archive.",
    "Archivo curado de artículos e investigaciones de la comunidad.",
    "Arquivo curado de artigos e pesquisas da comunidade.",
    "Кураторський архів статей і досліджень спільноти.",
    "커뮤니티 큐레이션 아티클과 리서치 아카이브입니다."
  ),
  englishNotice: lv(
    "This section stays mostly in English to preserve the original editorial format of the community archive.",
    "Esta sección se mantiene mayormente en inglés para preservar el formato editorial original del archivo comunitario.",
    "Esta seção permanece majoritariamente em inglês para preservar o formato editorial original do arquivo da comunidade.",
    "Цей розділ переважно залишено англійською, щоб зберегти оригінальний редакційний формат архіву спільноти.",
    "이 섹션은 커뮤니티 아카이브의 원본 편집 형식을 유지하기 위해 대부분 영어로 유지됩니다."
  )
};

const insightsItems: InsightItem[] = [
  {
    title: "Building Positions That Stay and Pay on StandX",
    author: "@Geraldi86116885",
    link: "https://x.com/Geraldi86116885/status/2041835682725794196",
    category: "Perps Guide"
  },
  {
    title: "Your Stop Loss Is Not Your Risk",
    author: "@Geraldi86116885",
    link: "https://x.com/Geraldi86116885/status/2036752089850822956",
    category: "Perps Guide"
  },
  {
    title: "Frozen Margin Syndrome",
    author: "@ttayfun_0",
    link: "https://docs.google.com/document/d/1ip1hWRIiNYi9T7fRptcw4nIsv-0K_uTg6ClrojUZj7M/edit",
    category: "Perps Guide"
  },
  {
    title: "Trading Smarter on StandX",
    author: "@JovanNeves",
    link: "https://docs.google.com/document/d/1G80HgY7wXHLfO4ZmRol2RteN-RsMipNAHapYoInf1uM/edit",
    category: "Perps Guide"
  },
  {
    title: "StandX - From Day One to Today",
    author: "@CrryptoKerim",
    link: "https://docs.google.com/document/d/1oG3hkouFak1zV3YCUF1gNyU1KFut3XrGzncN0JOOh-A/edit",
    category: "StandX Insight"
  },
  {
    title: "StandX Key Milestones & Activities Recap",
    author: "@dudulinux",
    link: "https://docs.google.com/document/d/1vsAWgXPgZpXdHfM5QuvgmDysxVe99rX5tTPwJzgnywE/edit",
    category: "StandX Insight"
  }
];

const aboutCopy = {
  role: lv(
    "Community researcher and creator",
    "Investigador y creador comunitario",
    "Pesquisador e criador comunitário",
    "Дослідник і креатор спільноти",
    "커뮤니티 리서처 & 크리에이터"
  ),
  bio: lv(
    "Trader navigating market cycles and creator of educational technical content for DeFi and perp DEX users. Focus areas include execution mechanics, DUSD, market analysis, and practical onboarding.",
    "Trader que navega ciclos de mercado y creador de contenido técnico educativo para usuarios DeFi y perp DEX. Sus focos incluyen mecánicas de ejecución, DUSD, análisis de mercado y onboarding práctico.",
    "Trader que navega ciclos de mercado e criador de conteúdo técnico educativo para usuários DeFi e perp DEX. Os focos incluem mecânicas de execução, DUSD, análise de mercado e onboarding prático.",
    "Трейдер, що проходить ринкові цикли, і автор технічного освітнього контенту для DeFi та perp DEX. Фокус: механіка виконання, DUSD, ринкова аналітика та практичний онбординг.",
    "시장 사이클을 분석하는 트레이더이자 DeFi/perp DEX 사용자를 위한 기술 교육 콘텐츠 제작자입니다. 실행 메커니즘, DUSD, 시장 분석, 실전 온보딩에 집중합니다."
  ),
  whyTitle: lv(
    "Why this hub exists",
    "Por qué existe este hub",
    "Por que este hub existe",
    "Чому існує цей хаб",
    "이 허브가 존재하는 이유"
  ),
  whyBodyOne: lv(
    "StandX has an active community and a deep technical ecosystem, but newcomers needed a free, no-login, no-barrier reference point.",
    "StandX tiene una comunidad activa y un ecosistema técnico profundo, pero los nuevos necesitaban un punto de referencia gratuito, sin login y sin barreras.",
    "A StandX tem uma comunidade ativa e um ecossistema técnico profundo, mas os novos usuários precisavam de um ponto de referência gratuito, sem login e sem barreiras.",
    "StandX має активну спільноту та глибоку технічну екосистему, але новачкам був потрібен безкоштовний, безлогінний і доступний орієнтир.",
    "StandX는 활발한 커뮤니티와 깊은 기술 생태계를 갖추고 있지만, 신규 사용자를 위한 무료/무로그인/무장벽 기준점이 필요했습니다."
  ),
  whyBodyTwo: lv(
    "This upgraded hub keeps the original mission alive: open access to brand kit, templates, references, and onboarding flows.",
    "Este hub mejorado mantiene viva la misión original: acceso abierto al brand kit, plantillas, referencias y flujos de onboarding.",
    "Este hub aprimorado mantém viva a missão original: acesso aberto ao brand kit, templates, referências e fluxos de onboarding.",
    "Оновлений хаб зберігає початкову місію: відкритий доступ до brand kit, шаблонів, прикладів і онбординг-флоу.",
    "업그레이드된 이 허브는 원래 미션을 유지합니다: brand kit, 템플릿, 레퍼런스, 온보딩 플로우에 대한 개방형 접근."
  ),
  warning: lv(
    "This material does not represent official StandX communications. It is a community initiative.",
    "Este material no representa comunicación oficial de StandX. Es una iniciativa comunitaria.",
    "Este material não representa comunicação oficial da StandX. É uma iniciativa comunitária.",
    "Ці матеріали не є офіційною комунікацією StandX. Це ініціатива спільноти.",
    "이 자료는 StandX의 공식 커뮤니케이션이 아닙니다. 커뮤니티 이니셔티브입니다."
  ),
  yhonRole: lv(
    "Software Engineer & Community Contributor",
    "Ingeniero de Software & Colaborador Comunitario",
    "Engenheiro de Software & Colaborador Comunitário",
    "Інженер-програміст & учасник спільноти",
    "소프트웨어 엔지니어 & 커뮤니티 기여자"
  ),
  yhonBio: lv(
    "Software Engineer behind the Next.js redesign of the StandX Community Hub. Focused on premium UX, multilingual accessibility, and building a space where anyone can understand, participate, and contribute to the StandX ecosystem.",
    "Ingeniero de Software detrás del rediseño en Next.js del StandX Community Hub. Enfocado en UX premium, accesibilidad multilingüe y en construir un espacio donde cualquiera pueda entender, participar y contribuir al ecosistema StandX.",
    "Engenheiro de Software por trás do redesign em Next.js do StandX Community Hub. Focado em UX premium, acessibilidade multilíngue e em criar um espaço onde qualquer pessoa possa entender, participar e contribuir com o ecossistema StandX.",
    "Інженер-програміст, який розробив редизайн StandX Community Hub на Next.js. Фокус — преміальний UX, багатомовна доступність та створення простору, де кожен може зрозуміти, долучитись і зробити внесок в екосистему StandX.",
    "StandX Community Hub의 Next.js 리디자인을 담당한 소프트웨어 엔지니어. 프리미엄 UX, 다국어 접근성, 그리고 누구나 StandX 생태계를 이해하고 참여하며 기여할 수 있는 공간 구축에 집중합니다."
  )
};

const englishInsightsNoticeLocales: AppLocale[] = ["pt-br", "uk", "ko"];

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    hubSections.map((section) => ({
      locale,
      section
    }))
  );
}

export async function generateMetadata({params}: SectionPageProps): Promise<Metadata> {
  const locale = isAppLocale(params.locale) ? params.locale : defaultLocale;
  const section = isHubSectionSlug(params.section)
    ? params.section
    : ("getting-started" as HubSectionSlug);

  const header = sectionHeaders[section];

  return {
    title: localized(locale, header.title),
    description: localized(locale, header.subtitle)
  };
}

export default function HubSectionPage({params}: SectionPageProps) {
  const locale = isAppLocale(params.locale) ? params.locale : defaultLocale;

  if (!isHubSectionSlug(params.section)) {
    notFound();
  }

  const section = params.section;
  const navItems = getHubNavItems(locale);
  const header = sectionHeaders[section];

  return (
    <div className="border-b border-border-hairline">
      <div className="section-shell border-b border-border-hairline overflow-x-auto">
        <nav
          className="flex min-w-max items-center gap-1 py-2"
          aria-label="Hub sections"
        >
          <Link href={`/${locale}`} className="nav-pill">
            {localized(locale, uiCopy.home)}
          </Link>

          {navItems.map((item) => {
            const isCurrent = item.slug === section;

            return (
              <Link
                key={item.slug}
                href={item.href}
                className="nav-pill"
                data-active={isCurrent || undefined}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="section-shell py-12 md:py-16">
        <header className="space-y-6">
          <div className="flex items-center gap-3 text-text-muted">
            <span className="font-mono text-[11px] uppercase tracking-widercaps">
              / {navItems.find((item) => item.slug === section)?.label}
            </span>
            <span className="hairline flex-1 max-w-[120px]" aria-hidden="true" />
          </div>
          <h1 className="text-balance text-display-lg uppercase text-text-primary">
            {localized(locale, header.title)}
          </h1>
          <p className="max-w-3xl text-pretty text-base leading-relaxed text-text-secondary md:text-lg">
            {localized(locale, header.subtitle)}
          </p>

          {header.notice ? (
            <div className="flex gap-3 border border-accent-lime/40 p-4">
              <span
                aria-hidden="true"
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-lime"
              />
              <p className="text-sm leading-relaxed text-text-primary">
                {localized(locale, header.notice)}
              </p>
            </div>
          ) : null}
        </header>

        <div className="mt-10 md:mt-12">{renderSectionContent(section, locale)}</div>
      </div>
    </div>
  );
}

function renderSectionContent(section: HubSectionSlug, locale: AppLocale) {
  switch (section) {
    case "getting-started":
      return renderGettingStarted(locale);
    case "brand-kit":
      return renderBrandKit(locale);
    case "templates":
      return renderTemplates(locale);
    case "references":
      return renderReferences(locale);
    case "community":
      return renderCommunity(locale);
    case "standers-insights":
      return renderInsights(locale);
    case "about":
      return renderAbout(locale);
    default:
      return null;
  }
}

function renderGettingStarted(locale: AppLocale) {
  return (
    <div className="space-y-6 md:space-y-8">
      <section className="panel p-6 md:p-7">
        <p className="eyebrow">{localized(locale, gettingStartedCopy.growthPathLabel)}</p>
        <p className="mt-4 text-base leading-relaxed text-text-secondary md:text-lg">
          {localized(locale, gettingStartedCopy.growthPathBody)}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
          {localized(locale, gettingStartedCopy.stepByStepTitle)}
        </h2>

        <ol className="relative space-y-3 pl-6">
          <span
            aria-hidden="true"
            className="absolute left-2 top-3 bottom-3 w-px"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,212,255,0.5), rgba(138,92,255,0.3), transparent)"
            }}
          />
          {growthSteps.map((step, index) => (
            <li key={index} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.15rem] top-4 h-2 w-2 rounded-full bg-accent-cyan shadow-[0_0_10px_rgba(0,212,255,0.7)]"
              />
              <article className="panel panel-hover px-5 py-4">
                <h3 className="text-base font-semibold text-text-primary">
                  {localized(locale, step.title)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {localized(locale, step.description)}
                </p>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {localized(locale, gettingStartedCopy.squadsTitle)}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            {localized(locale, gettingStartedCopy.squadsNotice)}
          </p>

          <div className="grid gap-2.5">
            {squadItems.map((squad, index) => (
              <article
                key={index}
                className="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.025]"
                style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.08)"}}
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan transition-all group-hover:shadow-[0_0_10px_rgba(0,212,255,0.6)]"
                />
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {localized(locale, squad.title)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {localized(locale, squad.description)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel panel-edge space-y-4 p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {localized(locale, gettingStartedCopy.sproutTitle)}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            {localized(locale, gettingStartedCopy.sproutLead)}
          </p>

          <ul className="space-y-2.5">
            {sproutCriteria.map((criterion, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm text-text-secondary"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-gain"
                />
                <span>{localized(locale, criterion)}</span>
              </li>
            ))}
          </ul>

          <a
            href="https://discord.gg/QkjVSetrup"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            style={{
              background: "linear-gradient(120deg, #5865f2 0%, #7289da 100%)"
            }}
          >
            {localized(locale, uiCopy.joinDiscord)}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}

function renderBrandKit(locale: AppLocale) {
  return (
    <div className="space-y-6">
      <a
        href="https://www.notion.so/StandX-Community-Brand-Kit-2cf509c0f89780c9a435f005e8afdc08"
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-text-primary transition hover:text-accent-cyan"
        style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
      >
        {localized(locale, uiCopy.openDocumentation)}
        <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
      </a>

      <div className="grid gap-4 md:grid-cols-2">
        {brandKitItems.map((item) => (
          <article
            key={item.link}
            className="panel panel-edge panel-hover group flex flex-col p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              {localized(locale, item.eyebrow)}
            </p>

            <h3 className="mt-3 text-lg font-semibold text-text-primary transition-colors group-hover:text-accent-cyan">
              {localized(locale, item.title)}
            </h3>

            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
              {localized(locale, item.body)}
            </p>

            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-medium text-text-primary transition hover:text-accent-cyan"
              style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
            >
              {localized(locale, uiCopy.openDrive)}
              <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>

      <div className="panel flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">
            {localized(locale, brandKitCopy.rootTitle)}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {localized(locale, brandKitCopy.rootBody)}
          </p>
        </div>

        <a
          href={rootKitLink}
          target="_blank"
          rel="noreferrer"
          className="cta-primary focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold shadow-glow md:self-auto"
        >
          {localized(locale, uiCopy.openRootFolder)}
          <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
        </a>
      </div>

      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,191,74,0.1), rgba(255,95,122,0.06))",
          boxShadow: "inset 0 0 0 1px rgba(255, 191, 74, 0.3)"
        }}
      >
        <span
          aria-hidden="true"
          className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-signal-caution shadow-[0_0_10px_rgba(255,191,74,0.6)]"
        />
        <p className="text-sm leading-relaxed text-text-primary">
          {localized(locale, brandKitCopy.warning)}
        </p>
      </div>
    </div>
  );
}

function renderTemplates(locale: AppLocale) {
  return (
    <div className="space-y-5">
      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(138,92,255,0.06))",
          boxShadow: "inset 0 0 0 1px rgba(0, 212, 255, 0.22)"
        }}
      >
        <span
          aria-hidden="true"
          className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan shadow-[0_0_10px_rgba(0,212,255,0.6)]"
        />
        <p className="text-sm leading-relaxed text-text-primary">
          {localized(locale, templatesNotice)}
        </p>
      </div>

      {templateBlocks.map((template) => (
        <article key={template.body} className="panel p-6">
          <h3 className="text-lg font-semibold text-text-primary">
            {localized(locale, template.title)}
          </h3>

          <pre
            className="mt-4 overflow-x-auto rounded-xl p-4 font-mono text-xs leading-relaxed text-text-secondary"
            style={{
              background:
                "linear-gradient(180deg, rgba(5, 9, 20, 0.85), rgba(3, 6, 15, 0.85))",
              boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.06)"
            }}
          >
            {template.body}
          </pre>
        </article>
      ))}
    </div>
  );
}

function renderReferences(locale: AppLocale) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {referenceItems.map((item) => (
        <article
          key={item.title}
          className="panel panel-edge panel-hover group flex flex-col p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {localized(locale, item.type)}
          </p>

          <h3 className="mt-3 text-lg font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-cyan">
            {item.title}
          </h3>

          <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
            {localized(locale, item.excerpt)}
          </p>

          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-medium text-text-primary transition hover:text-accent-cyan"
            style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
          >
            {localized(locale, uiCopy.openReference)}
            <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}

function renderCommunity(locale: AppLocale) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="panel panel-edge flex flex-col gap-3 p-6">
          <p className="eyebrow">{localized(locale, communityCopy.projectLabel)}</p>
          <h3 className="text-xl font-semibold text-text-primary">
            {localized(locale, communityCopy.projectTitle)}
          </h3>
          <p className="flex-1 text-sm leading-relaxed text-text-secondary">
            {localized(locale, communityCopy.projectDescription)}
          </p>

          <a
            href="https://standx-flappy.vercel.app/"
            target="_blank"
            rel="noreferrer"
            aria-label="Play StandX Flappy Candle in a new tab"
            className="focus-ring inline-flex min-h-10 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold text-bg-base transition hover:brightness-110"
            style={{
              background: "linear-gradient(120deg, #00ff9d 0%, #64e6ff 100%)",
              boxShadow: "0 10px 30px -10px rgba(0, 255, 157, 0.5)"
            }}
          >
            {localized(locale, uiCopy.playNow)}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </article>

        <article className="panel panel-edge flex flex-col gap-3 p-6">
          <p className="eyebrow">{localized(locale, communityCopy.serverLabel)}</p>
          <h3 className="text-xl font-semibold text-text-primary">
            {localized(locale, communityCopy.serverTitle)}
          </h3>
          <p className="flex-1 text-sm leading-relaxed text-text-secondary">
            {localized(locale, communityCopy.serverDescription)}
          </p>

          <a
            href="https://discord.gg/QkjVSetrup"
            target="_blank"
            rel="noreferrer"
            aria-label="Join StandX Discord in a new tab"
            className="focus-ring inline-flex min-h-10 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            style={{
              background: "linear-gradient(120deg, #5865f2 0%, #7289da 100%)",
              boxShadow: "0 10px 30px -10px rgba(88, 101, 242, 0.5)"
            }}
          >
            {localized(locale, uiCopy.joinDiscord)}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </article>

        <article className="panel panel-edge flex flex-col gap-3 p-6">
          <p className="eyebrow">{localized(locale, communityCopy.sipGuideLabel)}</p>
          <h3 className="text-xl font-semibold text-text-primary">
            {localized(locale, communityCopy.sipGuideTitle)}
          </h3>
          <p className="flex-1 text-sm leading-relaxed text-text-secondary">
            {localized(locale, communityCopy.sipGuideDescription)}
          </p>

          <a
            href="https://standx-sip-guide.vercel.app/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open StandX SIP Visual Guide in a new tab"
            className="focus-ring inline-flex min-h-10 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold text-bg-base transition hover:brightness-110"
            style={{
              background: "linear-gradient(120deg, #00d4ff 0%, #8a5cff 100%)",
              boxShadow: "0 10px 30px -10px rgba(0, 212, 255, 0.5)"
            }}
          >
            {localized(locale, uiCopy.exploreSIPs)}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </article>
      </div>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold tracking-tight text-text-primary">
          {localized(locale, communityCopy.creatorsTitle)}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {creatorItems.map((creator) => (
            <article
              key={creator.handle}
              className="panel panel-hover group flex flex-col gap-2 p-5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-text-primary transition-colors group-hover:text-accent-cyan">
                  {creator.name}
                </h4>
                <span className="chip-accent chip">
                  {localized(locale, creator.squad)}
                </span>
              </div>

              <a
                href={creator.link}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex w-fit font-mono text-xs text-accent-cyan transition hover:text-accent-gain"
              >
                {creator.handle}
              </a>

              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {localized(locale, creator.bio)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function renderInsights(locale: AppLocale) {
  return (
    <div className="space-y-6">
      <article className="panel panel-edge flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">
            {localized(locale, insightsCopy.databaseTitle)}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {localized(locale, insightsCopy.databaseDescription)}
          </p>
        </div>

        <a
          href="https://www.notion.so/2e70211f3ef7804aa4dcce5d4dd23404?v=2e70211f3ef780a78b44000c30776e6d"
          target="_blank"
          rel="noreferrer"
          className="cta-primary focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold shadow-glow md:self-auto"
        >
          {localized(locale, uiCopy.openNotion)}
          <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
        </a>
      </article>

      {englishInsightsNoticeLocales.includes(locale) ? (
        <div
          className="flex gap-3 rounded-2xl p-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(138,92,255,0.06))",
            boxShadow: "inset 0 0 0 1px rgba(0, 212, 255, 0.22)"
          }}
        >
          <span
            aria-hidden="true"
            className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan shadow-[0_0_10px_rgba(0,212,255,0.6)]"
          />
          <p className="text-sm leading-relaxed text-text-primary">
            {localized(locale, insightsCopy.englishNotice)}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {insightsItems.map((item) => (
          <article
            key={item.title}
            className="panel panel-hover group flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="chip chip-accent">{item.category}</span>
                <span className="font-mono text-xs text-text-muted">
                  {item.author}
                </span>
              </div>
              <h4 className="text-base font-semibold text-text-primary transition-colors group-hover:text-accent-cyan">
                {item.title}
              </h4>
            </div>

            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-xl px-3 py-2 text-sm text-text-primary transition hover:text-accent-cyan sm:self-auto"
              style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
            >
              {localized(locale, uiCopy.openArticle)}
              <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

function renderAbout(locale: AppLocale) {
  return (
    <div className="space-y-6">
      <article className="panel panel-edge p-6 md:p-7">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full font-mono text-sm font-semibold text-bg-base"
            style={{
              background: "linear-gradient(135deg, #00ff9d 0%, #00d4ff 100%)"
            }}
          >
            YP
          </div>
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Yhonatan Peguero</h3>
            <a
              href="https://x.com/thisnotmeeme"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Yhonatan Peguero's X profile in a new tab"
              className="focus-ring font-mono text-sm text-accent-cyan transition hover:text-accent-gain"
            >
              @thisnotmeeme
            </a>
          </div>
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {localized(locale, aboutCopy.yhonRole)}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {localized(locale, aboutCopy.yhonBio)}
        </p>

        <a
          href="https://x.com/thisnotmeeme"
          target="_blank"
          rel="noreferrer"
          aria-label="Visit Yhonatan Peguero's X profile in a new tab"
          className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-primary transition hover:text-accent-cyan"
          style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
        >
          {localized(locale, uiCopy.openXProfile)}
          <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
        </a>
      </article>

      <article className="panel panel-edge p-6 md:p-7">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full font-mono text-sm font-semibold text-bg-base"
            style={{
              background: "linear-gradient(135deg, #00d4ff 0%, #8a5cff 100%)"
            }}
          >
            TW
          </div>
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Tarzan Web3</h3>
            <a
              href="https://x.com/victordesouza96"
              target="_blank"
              rel="noreferrer"
              className="focus-ring font-mono text-sm text-accent-cyan transition hover:text-accent-gain"
            >
              @victordesouza96
            </a>
          </div>
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {localized(locale, aboutCopy.role)}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {localized(locale, aboutCopy.bio)}
        </p>

        <a
          href="https://x.com/victordesouza96"
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-primary transition hover:text-accent-cyan"
          style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
        >
          {localized(locale, uiCopy.openXProfile)}
          <ExternalLink className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]" aria-hidden="true" />
        </a>
      </article>

      <article className="panel p-6 md:p-7">
        <h3 className="text-xl font-semibold text-text-primary">
          {localized(locale, aboutCopy.whyTitle)}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {localized(locale, aboutCopy.whyBodyOne)}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {localized(locale, aboutCopy.whyBodyTwo)}
        </p>
      </article>

      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,191,74,0.1), rgba(255,95,122,0.06))",
          boxShadow: "inset 0 0 0 1px rgba(255, 191, 74, 0.3)"
        }}
      >
        <span
          aria-hidden="true"
          className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-signal-caution shadow-[0_0_10px_rgba(255,191,74,0.6)]"
        />
        <p className="text-sm leading-relaxed text-text-primary">
          {localized(locale, aboutCopy.warning)}
        </p>
      </div>
    </div>
  );
}
