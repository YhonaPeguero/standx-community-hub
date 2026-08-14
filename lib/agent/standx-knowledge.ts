import type {AppLocale} from "@/i18n/request";

type LocalizedText = Record<AppLocale, string>;

export type KnowledgeVolatility = "stable" | "changeable";

export interface CoreKnowledgeTopic {
  id: string;
  title: string;
  /** Search phrases are deliberately curated per locale; matching is offline. */
  aliases: Record<AppLocale, readonly string[]>;
  /** Lets a specific intent outrank a broader phrase it contains. */
  matchPriority?: number;
  /** Self-contained, visitor-facing answer used when no model is needed. */
  answer: LocalizedText;
  /** Canonical English fact block used in the optional model prompt. */
  fact: string;
  /** Titles must exist in `docPages`; `findDoc` validates them at runtime. */
  docTitles: readonly string[];
  volatility: KnowledgeVolatility;
  verifiedAt: string;
}

/**
 * The high-confidence layer Stander can answer without a model.
 *
 * Facts are intentionally compact and traceable to official StandX pages. The
 * English `fact` is the canonical source for the model prompt; localized
 * answers are presentation copy, not separate factual records.
 */
export const coreKnowledgeTopics = [
  {
    id: "standx-overview",
    title: "What StandX is",
    aliases: {
      en: [
        "what is standx",
        "what does standx do",
        "how does standx work",
        "tell me about standx",
        "about standx",
        "explain standx"
      ],
      es: [
        "que es standx",
        "que hace standx",
        "como funciona standx",
        "cuentame sobre standx",
        "sobre standx",
        "explica standx"
      ],
      "pt-br": [
        "o que e standx",
        "o que e a standx",
        "o que standx faz",
        "como funciona standx",
        "me fale sobre standx",
        "sobre standx",
        "explica standx"
      ],
      uk: [
        "що таке standx",
        "що робить standx",
        "як працює standx",
        "розкажи про standx",
        "про standx",
        "поясни standx"
      ],
      ko: [
        "standx가 무엇",
        "standx는 무엇을",
        "standx 작동 방식",
        "standx에 대해",
        "standx란",
        "standx 설명"
      ]
    },
    answer: {
      en: "StandX is a decentralized exchange for perpetual futures, with DUSD as its yield-bearing margin and quote asset.\n\nThe important part is how the pieces connect: DUSD is designed to keep trading collateral productive, while StandX Perps uses the same asset for pricing, margin, PnL, and fees. Its broader vision combines Universal Yield with Universal Markets; SIP-5 is the framework being developed for communities to create and support markets under public rules. StandX is live on BNB Chain and Solana, and its core team includes members of the original Binance Futures founding team.\n\nIf you want, I can explain DUSD, Perps, or the SIPs next.",
      es: "StandX es un exchange descentralizado de futuros perpetuos que utiliza DUSD como activo de margen y cotización con rendimiento.\n\nLo importante es cómo se conectan las piezas: DUSD busca mantener productivo el colateral de trading, mientras StandX Perps utiliza el mismo activo para precios, margen, PnL y comisiones. Su visión más amplia combina Universal Yield con Universal Markets; SIP-5 es el marco en desarrollo para que las comunidades creen y respalden mercados bajo reglas públicas. StandX opera en BNB Chain y Solana, y su equipo principal incluye miembros del equipo fundador original de Binance Futures.\n\nSi quieres, puedo explicarte DUSD, Perps o los SIPs a continuación.",
      "pt-br": "StandX é uma exchange descentralizada de futuros perpétuos que usa DUSD como ativo de margem e cotação com rendimento.\n\nO ponto principal é como as partes se conectam: o DUSD busca manter o colateral de trading produtivo, enquanto a StandX Perps usa o mesmo ativo para preços, margem, PnL e taxas. A visão mais ampla combina Universal Yield com Universal Markets; o SIP-5 é o framework em desenvolvimento para que comunidades criem e apoiem mercados sob regras públicas. A StandX opera na BNB Chain e na Solana, e sua equipe principal inclui membros da equipe fundadora original da Binance Futures.\n\nSe quiser, posso explicar DUSD, Perps ou os SIPs em seguida.",
      uk: "StandX — це децентралізована біржа безстрокових ф'ючерсів, де DUSD є дохідним активом маржі та котирування.\n\nГоловне — як поєднані її частини: DUSD має робити торгове забезпечення продуктивним, а StandX Perps використовує той самий актив для ціноутворення, маржі, PnL і комісій. Ширше бачення поєднує Universal Yield та Universal Markets; SIP-5 — це рамкова система в розробці, за якою спільноти зможуть створювати й підтримувати ринки за публічними правилами. StandX працює в BNB Chain і Solana, а до основної команди входять учасники початкової команди Binance Futures.\n\nЯкщо хочете, далі можу пояснити DUSD, Perps або SIP.",
      ko: "StandX는 DUSD를 수익형 증거금·호가 자산으로 사용하는 무기한 선물 탈중앙화 거래소입니다.\n\n핵심은 각 요소가 연결되는 방식입니다. DUSD는 거래 담보가 유휴 상태로 남지 않도록 설계되고, StandX Perps는 같은 자산을 가격 표시, 증거금, PnL, 수수료에 사용합니다. 더 큰 비전은 Universal Yield와 Universal Markets를 결합하는 것이며, SIP-5는 커뮤니티가 공개 규칙에 따라 시장을 만들고 지원하기 위해 개발 중인 프레임워크입니다. StandX는 BNB Chain과 Solana에서 운영되며 핵심 팀에는 초기 Binance Futures 창립 팀 멤버들이 포함됩니다.\n\n원하시면 다음으로 DUSD, Perps 또는 SIP를 설명해 드릴게요."
    },
    fact: "StandX is a perpetual-futures DEX live across BNB Chain and Solana, listing both crypto perps and equity (stock) perps. DUSD is its yield-bearing unified margin and quote asset. The core team includes founders of Binance Futures alongside people from Goldman Sachs; the official About page says the project is fully self-funded and has not accepted any external investment.",
    docTitles: ["About StandX", "Perps Overview"],
    volatility: "stable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "getting-started",
    title: "Getting started with StandX",
    // Most phrasings of this also contain "standx", so without a priority bump
    // it loses to the broader overview topic. It is one of the four suggestion
    // chips, so it must never fall through to "no verified answer".
    matchPriority: 3,
    aliases: {
      en: [
        "how do i get started",
        "how to get started",
        "get started",
        "getting started",
        "how do i start",
        "where do i start",
        "first steps",
        "new to standx",
        "beginner"
      ],
      es: [
        "como empiezo",
        "como empezar",
        "empezar",
        "primeros pasos",
        "por donde empiezo",
        "soy nuevo",
        "principiante"
      ],
      "pt-br": [
        "como comeco",
        "como comecar",
        "comecar",
        "primeiros passos",
        "por onde comeco",
        "sou novo",
        "iniciante"
      ],
      uk: [
        "як почати",
        "з чого почати",
        "перші кроки",
        "я новачок",
        "початківець"
      ],
      ko: [
        "어떻게 시작",
        "시작하는 방법",
        "시작하려면",
        "첫 단계",
        "초보"
      ]
    },
    answer: {
      en: "Start with a wallet, then DUSD, then your first trade.\n\nConnect a supported wallet to StandX Perps — the wallet guide walks through the setup, and there is a dedicated walkthrough for a first trade using Binance Wallet. Fund the account and get DUSD, which is the unified margin and quote asset, so the same balance both earns and backs your positions. Then open a small position from the execution panel, where margin, leverage and TP/SL are set before you confirm.\n\nBefore sizing up it is worth reading how margin and liquidation work. On this hub, the Getting Started section collects the community walkthroughs, and Discord is where people ask the questions that are not in the docs yet.",
      es: "Empieza por la wallet, luego DUSD y después tu primera operación.\n\nConecta una wallet compatible a StandX Perps — la guía de wallet cubre la configuración, y hay un tutorial dedicado para la primera operación con Binance Wallet. Financia la cuenta y consigue DUSD, que es el activo unificado de margen y cotización, así el mismo saldo genera rendimiento y respalda tus posiciones. Luego abre una posición pequeña desde el panel de ejecución, donde se define margen, apalancamiento y TP/SL antes de confirmar.\n\nAntes de aumentar el tamaño conviene leer cómo funcionan el margen y la liquidación. En este hub, la sección Getting Started reúne las guías de la comunidad, y Discord es donde se pregunta lo que aún no está en la documentación.",
      "pt-br": "Comece pela carteira, depois DUSD e então sua primeira operação.\n\nConecte uma carteira compatível ao StandX Perps — o guia de carteira cobre a configuração, e há um tutorial dedicado para a primeira operação com a Binance Wallet. Deposite e obtenha DUSD, que é o ativo unificado de margem e cotação, assim o mesmo saldo rende e sustenta suas posições. Depois abra uma posição pequena pelo painel de execução, onde margem, alavancagem e TP/SL são definidos antes de confirmar.\n\nAntes de aumentar o tamanho vale ler como funcionam margem e liquidação. Neste hub, a seção Getting Started reúne os guias da comunidade, e o Discord é onde se pergunta o que ainda não está na documentação.",
      uk: "Почніть із гаманця, далі DUSD, а потім перша угода.\n\nПідключіть підтримуваний гаманець до StandX Perps — посібник із гаманця описує налаштування, а для першої угоди є окрема інструкція з Binance Wallet. Поповніть рахунок і отримайте DUSD — єдиний актив маржі та котирування, тож той самий баланс і приносить дохід, і забезпечує позиції. Далі відкрийте невелику позицію в панелі виконання, де маржа, плече і TP/SL задаються до підтвердження.\n\nПерш ніж збільшувати обсяг, варто прочитати, як працюють маржа та ліквідація. На цьому хабі розділ Getting Started збирає спільнотні інструкції, а Discord — місце для питань, яких ще немає в документації.",
      ko: "지갑, DUSD, 첫 거래 순서로 시작하세요.\n\n지원되는 지갑을 StandX Perps에 연결합니다 — 지갑 가이드에 설정 과정이 있고, Binance Wallet으로 첫 거래를 하는 전용 안내도 있습니다. 입금 후 DUSD를 확보하세요. DUSD는 통합 증거금·호가 자산이므로 같은 잔액이 수익도 쌓고 포지션도 뒷받침니다. 그다음 실행 패널에서 작은 포지션을 열어보세요. 확인 전에 증거금, 레버리지, TP/SL을 설정합니다.\n\n규모를 늘리기 전에 증거금과 청산이 어떻게 작동하는지 읽어두면 좋습니다. 이 허브의 Getting Started 섹션에 커뮤니티 가이드가 모여 있고, 문서에 아직 없는 질문은 Discord에서 물어볼 수 있습니다."
    },
    fact: "Getting started on StandX: connect a supported wallet to StandX Perps (see the wallet guide, and the dedicated first-trade walkthrough using Binance Wallet), fund the account and obtain DUSD as the unified margin and quote asset, then open a small position from the execution panel where margin, leverage and TP/SL are configured before confirming. Reading Margin & Leverage and Liquidation before sizing up is recommended. This hub's Getting Started section collects community walkthroughs.",
    docTitles: [
      "StandX Wallet Guide",
      "First Perps Trade with Binance Wallet",
      "The Execution Panel",
      "Margin & Leverage"
    ],
    volatility: "stable",
    verifiedAt: "2026-08-13"
  },
  {
    id: "dusd-overview",
    title: "DUSD overview",
    aliases: {
      en: ["what is dusd", "dusd", "yield bearing stablecoin", "dusd backed"],
      es: ["que es dusd", "dusd", "stablecoin con rendimiento", "respaldo de dusd"],
      "pt-br": ["o que e dusd", "dusd", "stablecoin com rendimento", "lastro do dusd"],
      uk: ["що таке dusd", "dusd", "дохідний стейблкоїн", "забезпечення dusd"],
      ko: ["dusd가 무엇", "dusd", "수익형 스테이블코인", "dusd 담보"]
    },
    answer: {
      en: "DUSD is StandX's yield-bearing stablecoin and the unified margin and quote asset for Perps.\n\nEligible balances accrue rewards automatically, with no staking or lockup required. According to the official docs, yield comes mainly from staking rewards on backing spot assets and funding income from short-futures hedges; the design also uses market-neutral backing, custody controls, and a reserve fund to manage risk. That lets the same DUSD remain liquid and useful as trading collateral instead of forcing users to choose between utility and yield.\n\nThe yield is variable, not guaranteed. I can also explain minting, redemption, or the hedging model.",
      es: "DUSD es la stablecoin con rendimiento de StandX y el activo unificado de margen y cotización para Perps.\n\nLos saldos elegibles acumulan recompensas automáticamente, sin staking ni bloqueo. Según la documentación oficial, el rendimiento proviene principalmente de recompensas de staking sobre los activos spot de respaldo y del funding de coberturas con futuros en corto; el diseño también utiliza respaldo neutral al mercado, controles de custodia y un fondo de reserva para gestionar el riesgo. Así, el mismo DUSD puede conservar liquidez y servir como colateral de trading sin obligar al usuario a elegir entre utilidad y rendimiento.\n\nEl rendimiento es variable, no garantizado. También puedo explicarte el mint, el canje o el modelo de cobertura.",
      "pt-br": "DUSD é a stablecoin com rendimento da StandX e o ativo unificado de margem e cotação para Perps.\n\nOs saldos elegíveis acumulam recompensas automaticamente, sem staking ou bloqueio. Segundo a documentação oficial, o rendimento vem principalmente das recompensas de staking dos ativos spot de lastro e do funding de proteções com futuros vendidos; o design também usa lastro neutro ao mercado, controles de custódia e um fundo de reserva para gerenciar risco. Assim, o mesmo DUSD pode manter liquidez e servir como colateral de trading sem obrigar o usuário a escolher entre utilidade e rendimento.\n\nO rendimento é variável, não garantido. Também posso explicar mint, resgate ou o modelo de hedge.",
      uk: "DUSD — це дохідний стейблкоїн StandX і єдиний актив маржі та котирування для Perps.\n\nНа придатні баланси винагорода нараховується автоматично, без стейкінгу чи блокування. За офіційною документацією, дохід переважно надходить від стейкінгових винагород активів спотового забезпечення та funding-доходу коротких ф'ючерсних хеджів; для керування ризиком також використовуються ринково-нейтральне забезпечення, контроль зберігання активів і резервний фонд. Завдяки цьому той самий DUSD залишається ліквідним і придатним як торгове забезпечення, без вибору між корисністю та доходом.\n\nДохідність змінна й не гарантована. Також можу пояснити мінт, погашення або модель хеджування.",
      ko: "DUSD는 StandX의 수익형 스테이블코인이자 Perps의 통합 증거금·호가 자산입니다.\n\n적격 잔액에는 스테이킹이나 락업 없이 보상이 자동 적립됩니다. 공식 문서에 따르면 수익은 주로 담보 현물 자산의 스테이킹 보상과 숏 선물 헤지의 펀딩 수익에서 나오며, 시장 중립적 담보 구조, 커스터디 통제, 준비금으로 위험을 관리합니다. 따라서 사용자는 유동성과 수익 중 하나를 포기하지 않고 같은 DUSD를 거래 담보로 활용할 수 있습니다.\n\n수익률은 변동하며 보장되지 않습니다. 원하시면 민팅, 상환 또는 헤지 모델도 설명해 드릴게요."
    },
    fact: "DUSD is StandX's yield-bearing stablecoin and the unified margin and quote asset for Perps. No staking or lock is required. Rewards accrue to eligible balances automatically. The backing design combines spot assets with short perpetual positions to target market neutrality, supported by custody and reserve controls.",
    docTitles: ["$DUSD Overview", "Risks & Hedging System"],
    volatility: "stable",
    verifiedAt: "2026-08-12"
  },
  {
    id: "dusd-yield",
    title: "How DUSD yield works",
    matchPriority: 4,
    aliases: {
      en: ["dusd yield", "dusd rewards", "how does dusd earn", "where does yield come from"],
      es: ["rendimiento de dusd", "recompensas de dusd", "como genera rendimiento dusd", "de donde sale el rendimiento"],
      "pt-br": ["rendimento do dusd", "recompensas do dusd", "como dusd rende", "de onde vem o rendimento"],
      uk: ["дохідність dusd", "винагороди dusd", "як dusd приносить дохід", "звідки дохідність"],
      ko: ["dusd 수익", "dusd 보상", "dusd 수익 구조", "수익은 어디서"]
    },
    answer: {
      en: "DUSD yield comes primarily from staking rewards on backing assets and funding income from the short-perpetual hedge. It accrues automatically to eligible DUSD balances; the rate is variable, so the live app or docs are the right place for the current figure.",
      es: "El rendimiento de DUSD proviene principalmente de recompensas de staking de los activos de respaldo y del funding de la cobertura con perpetuos en corto. Se acumula automáticamente en saldos DUSD elegibles; la tasa es variable, así que conviene revisar la app o documentación en vivo.",
      "pt-br": "O rendimento do DUSD vem principalmente das recompensas de staking dos ativos de lastro e do funding da proteção com perpétuos vendidos. Ele acumula automaticamente nos saldos DUSD elegíveis; a taxa varia, então consulte o app ou a documentação ao vivo.",
      uk: "Дохід DUSD переважно походить від стейкінгових винагород активів забезпечення та funding-доходу від короткого хеджу у безстрокових ф'ючерсах. Він автоматично нараховується на придатні баланси DUSD; ставка змінюється, тому актуальне значення слід перевіряти в застосунку або документації.",
      ko: "DUSD 수익은 주로 담보 자산의 스테이킹 보상과 숏 무기한 선물 헤지의 펀딩 수익에서 나옵니다. 적격 DUSD 잔액에 자동 적립되며 수익률은 변동되므로 현재 수치는 앱이나 공식 문서에서 확인해야 합니다."
    },
    fact: "DUSD yield primarily comes from staking rewards on backing assets and funding income from the short-perpetual hedge. It accrues automatically to eligible DUSD balances without staking. Yield is variable and current rates must be checked in the live app or official docs.",
    docTitles: ["DUSD Yielding Circle", "$DUSD Overview"],
    volatility: "changeable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "dusd-mint-redeem",
    title: "Minting and redeeming DUSD",
    matchPriority: 4,
    aliases: {
      en: ["mint dusd", "redeem dusd", "buy dusd", "dusd mint fee", "dusd redemption"],
      es: ["mintear dusd", "redimir dusd", "comprar dusd", "comision de mint de dusd", "canjear dusd"],
      "pt-br": ["cunhar dusd", "resgatar dusd", "comprar dusd", "taxa de mint do dusd"],
      uk: ["мінт dusd", "погашення dusd", "купити dusd", "комісія мінту dusd"],
      ko: ["dusd 민팅", "dusd 상환", "dusd 구매", "dusd 민팅 수수료"]
    },
    answer: {
      en: "The official guide currently supports minting DUSD with USDT or USDC, with a $5 minimum and no minting fee; network gas still applies. Redemption carries a 0.1% fee and a seven-day processing period, so verify the live terms before acting.",
      es: "La guía oficial permite actualmente mintear DUSD con USDT o USDC, con un mínimo de $5 y sin comisión de mint; el gas de red sí aplica. El canje tiene una comisión de 0.1% y un plazo de procesamiento de siete días, por lo que debes verificar las condiciones vigentes.",
      "pt-br": "O guia oficial permite atualmente cunhar DUSD com USDT ou USDC, com mínimo de US$ 5 e sem taxa de mint; o gas da rede ainda se aplica. O resgate tem taxa de 0,1% e prazo de processamento de sete dias, então confirme as condições atuais.",
      uk: "Офіційний посібник наразі дозволяє мінтити DUSD за USDT або USDC з мінімумом $5 і без комісії за мінт; мережевий gas оплачується окремо. Погашення має комісію 0,1% і семиденний строк обробки, тому перевіряйте актуальні умови.",
      ko: "공식 가이드상 현재 USDT 또는 USDC로 최소 5달러부터 DUSD를 민팅할 수 있고 민팅 수수료는 없지만 네트워크 가스비는 발생합니다. 상환 수수료는 0.1%이고 처리 기간은 7일이므로 실행 전 최신 조건을 확인하세요."
    },
    fact: "The official guides currently say users can mint DUSD from USDT or USDC with a $5 minimum and no minting fee, excluding network gas. The Product FAQ states a 0.1% redemption fee and a seven-day redemption period. Treat these parameters as changeable and point to the live guide.",
    docTitles: ["Minting DUSD", "Redeeming DUSD", "DUSD Product FAQ"],
    volatility: "changeable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "perps-overview",
    title: "StandX Perps",
    aliases: {
      en: ["standx perps", "perpetual futures", "perpetuals", "how do perps work"],
      es: ["perps de standx", "futuros perpetuos", "perpetuos", "como funcionan los perps"],
      "pt-br": ["perps da standx", "futuros perpetuos", "perpetuos", "como funcionam os perps"],
      uk: ["standx perps", "безстрокові ф'ючерси", "як працюють perps"],
      ko: ["standx perps", "무기한 선물", "perps 작동 방식"]
    },
    answer: {
      en: "StandX Perps is the perpetual-futures execution layer of the protocol, with DUSD as its unified pricing and margin asset.\n\nBecause pricing, margin, PnL, fees, and risk settlement use the same unit, DUSD is integrated into the trading system rather than added as a separate yield product. Eligible unused DUSD margin can continue accruing native yield while positions are open, which is intended to make trading capital more efficient. The wider roadmap connects this engine to community-supported markets through SIP-5.\n\nYield does not remove trading risks such as leverage, funding, or liquidation. I can explain any of those mechanics next.",
      es: "StandX Perps es la capa de ejecución de futuros perpetuos del protocolo, con DUSD como activo unificado de precios y margen.\n\nComo los precios, el margen, el PnL, las comisiones y la liquidación de riesgo utilizan la misma unidad, DUSD está integrado en el sistema de trading en lugar de añadirse como un producto de rendimiento separado. El margen DUSD elegible que no esté utilizado puede seguir acumulando rendimiento nativo mientras hay posiciones abiertas, con el objetivo de hacer más eficiente el capital de trading. La hoja de ruta conecta este motor con mercados respaldados por la comunidad mediante SIP-5.\n\nEl rendimiento no elimina riesgos como el apalancamiento, el funding o la liquidación. Puedo explicarte cualquiera de esos mecanismos.",
      "pt-br": "StandX Perps é a camada de execução de futuros perpétuos do protocolo, com DUSD como ativo unificado de preços e margem.\n\nComo preços, margem, PnL, taxas e liquidação de risco usam a mesma unidade, o DUSD está integrado ao sistema de trading em vez de ser adicionado como um produto de rendimento separado. A margem DUSD elegível e não utilizada pode continuar acumulando rendimento nativo enquanto existem posições abertas, buscando tornar o capital de trading mais eficiente. O roadmap conecta esse motor a mercados apoiados pela comunidade por meio do SIP-5.\n\nO rendimento não elimina riscos como alavancagem, funding ou liquidação. Posso explicar qualquer um desses mecanismos em seguida.",
      uk: "StandX Perps — це рівень виконання безстрокових ф'ючерсів протоколу, де DUSD є єдиним активом ціноутворення та маржі.\n\nОскільки ціни, маржа, PnL, комісії та ризикові розрахунки використовують одну одиницю, DUSD інтегровано в торгову систему, а не додано як окремий дохідний продукт. Невикористана придатна маржа DUSD може й надалі накопичувати власний дохід, поки позиції відкриті, що має підвищувати ефективність торгового капіталу. Дорожня карта поєднує цей механізм із ринками, які підтримує спільнота, через SIP-5.\n\nДохід не усуває ризики плеча, funding чи ліквідації. Можу пояснити будь-який із цих механізмів далі.",
      ko: "StandX Perps는 DUSD를 통합 가격 표시·증거금 자산으로 사용하는 프로토콜의 무기한 선물 실행 계층입니다.\n\n가격, 증거금, PnL, 수수료, 위험 정산이 같은 단위를 사용하므로 DUSD는 별도의 수익 상품으로 덧붙는 것이 아니라 거래 시스템에 통합됩니다. 포지션이 열려 있는 동안 사용되지 않는 적격 DUSD 증거금은 고유 수익을 계속 적립할 수 있어 거래 자본의 효율성을 높이도록 설계되었습니다. 더 넓은 로드맵은 SIP-5를 통해 이 엔진을 커뮤니티 지원 시장과 연결합니다.\n\n수익이 레버리지, 펀딩, 청산 같은 거래 위험을 없애는 것은 아닙니다. 원하시면 다음으로 그중 하나를 설명해 드릴게요."
    },
    fact: "StandX Perps is the protocol's perpetual-futures execution layer. DUSD is the unified margin and quote asset. Eligible unused DUSD margin can continue accruing native yield while a trader has positions open.",
    docTitles: ["Perps Overview"],
    volatility: "stable",
    verifiedAt: "2026-08-12"
  },
  {
    id: "trading-fees",
    title: "Perps trading fees",
    matchPriority: 4,
    aliases: {
      en: ["trading fee", "trading fees", "maker fee", "taker fee", "perps fees"],
      es: ["comision de trading", "comisiones de trading", "comision maker", "comision taker", "fees de perps"],
      "pt-br": ["taxa de trading", "taxas de trading", "taxa maker", "taxa taker", "taxas de perps"],
      uk: ["торгова комісія", "комісії за торгівлю", "комісія maker", "комісія taker"],
      ko: ["거래 수수료", "maker 수수료", "taker 수수료", "perps 수수료"]
    },
    answer: {
      en: "The current official schedule is 0.01% for maker orders and 0.04% for taker orders. The fee is calculated from the notional value of each matched trade; check the live fee page in case the schedule changes.",
      es: "La tarifa oficial actual es 0.01% para órdenes maker y 0.04% para órdenes taker. La comisión se calcula sobre el valor nocional de cada operación ejecutada; revisa la página vigente por si cambia.",
      "pt-br": "A tabela oficial atual é de 0,01% para ordens maker e 0,04% para ordens taker. A taxa é calculada sobre o valor nocional de cada operação executada; confira a página atual caso haja mudanças.",
      uk: "Чинна офіційна ставка становить 0,01% для maker-ордерів і 0,04% для taker-ордерів. Комісія розраховується від номінальної вартості кожної виконаної угоди; перевіряйте актуальну сторінку на випадок змін.",
      ko: "현재 공식 수수료는 maker 주문 0.01%, taker 주문 0.04%입니다. 각 체결 거래의 명목가치를 기준으로 계산되며, 변경 가능성이 있으므로 최신 수수료 페이지를 확인하세요."
    },
    fact: "The current official Perps fee schedule is 0.01% for maker orders and 0.04% for taker orders. Fees are calculated from the notional value of each matched trade. Treat the schedule as changeable.",
    docTitles: ["Trading Fee"],
    volatility: "changeable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "equity-perps",
    title: "Equity Perps (stock markets)",
    matchPriority: 5,
    aliases: {
      en: [
        "equity perps",
        "stock perps",
        "stock market",
        "trade stocks",
        "dividend adjustment",
        "us stocks",
        "korean stocks"
      ],
      es: [
        "perps de acciones",
        "acciones",
        "mercado de acciones",
        "ajuste por dividendos",
        "acciones de eeuu",
        "acciones coreanas"
      ],
      "pt-br": [
        "perps de acoes",
        "acoes",
        "mercado de acoes",
        "ajuste de dividendos",
        "acoes dos eua",
        "acoes coreanas"
      ],
      // Ukrainian declines, and matching is plain substring — so the nominative
      // alone misses "торгувати акціями". The common case forms are listed.
      uk: [
        "акційні перпи",
        "акції",
        "акціями",
        "акціях",
        "акцій",
        "фондовий ринок",
        "коригування дивідендів",
        "американські акції",
        "корейські акції"
      ],
      ko: ["주식 perps", "주식 시장", "주식 거래", "배당 조정", "미국 주식", "한국 주식"]
    },
    answer: {
      en: "StandX also lists Equity Perps — perpetual contracts that track the price of a stock. The docs are explicit that holding the contract is not the same as holding the share: no ownership, no voting, and no dividend paid to you as a shareholder.\n\nDividends are handled through a one-time funding settlement instead, so longs and shorts end up even. Longs receive a credit equal to the dividend and shorts pay it, peer to peer, with no fee taken by StandX; the rate is -D / M, the dividend per share over the mark price. Settlement runs at 20:00 ET the day before the ex-date for US stocks, and at 08:00 KST on the ex-date for Korean stocks. It is exempt from the usual hourly funding cap, so longs always receive the full value. Thirty minutes beforehand, reduce-only mode turns on and the mark-price deviation threshold tightens.\n\nWhich markets are listed changes, so the contract specifications page is the place to check.",
      es: "StandX también lista Equity Perps: contratos perpetuos que siguen el precio de una acción. La documentación es explícita en que tener el contrato no es tener la acción: no hay propiedad, ni voto, ni dividendo cobrado como accionista.\n\nLos dividendos se resuelven con una liquidación de funding puntual para que largos y cortos queden igualados. Los largos reciben un crédito equivalente al dividendo y los cortos lo pagan, entre pares, sin comisión de StandX; la tasa es -D / M, el dividendo por acción sobre el precio de marca. La liquidación ocurre a las 20:00 ET del día anterior a la fecha ex para acciones de EE. UU., y a las 08:00 KST en la fecha ex para acciones coreanas. Está exenta del tope horario de funding, así que los largos siempre reciben el valor íntegro. Treinta minutos antes se activa el modo reduce-only y se estrecha el umbral de desviación del precio de marca.\n\nQué mercados están listados cambia, así que conviene consultar la página de especificaciones de contrato.",
      "pt-br": "A StandX também lista Equity Perps: contratos perpétuos que acompanham o preço de uma ação. A documentação é explícita ao dizer que ter o contrato não é ter a ação: não há propriedade, voto nem dividendo recebido como acionista.\n\nOs dividendos são resolvidos por uma liquidação de funding pontual, para que comprados e vendidos fiquem equiparados. Os comprados recebem um crédito igual ao dividendo e os vendidos o pagam, entre pares, sem taxa da StandX; a taxa é -D / M, o dividendo por ação sobre o preço de marca. A liquidação ocorre às 20:00 ET do dia anterior à data ex para ações dos EUA, e às 08:00 KST na data ex para ações coreanas. Ela é isenta do teto horário de funding, então os comprados sempre recebem o valor integral. Trinta minutos antes, o modo reduce-only é ativado e o limite de desvio do preço de marca é estreitado.\n\nQuais mercados estão listados muda, então a página de especificações de contrato é o lugar para conferir.",
      uk: "StandX також лістить Equity Perps — безстрокові контракти, що відстежують ціну акції. Документація прямо зазначає: тримати контракт не означає тримати акцію — немає ні власності, ні голосу, ні дивіденду як акціонеру.\n\nДивіденди натомість врегульовуються одноразовим розрахунком funding, щоб лонги й шорти лишилися врівні. Лонги отримують кредит на суму дивіденду, а шорти його сплачують, напряму між собою, без комісії StandX; ставка дорівнює -D / M, дивіденд на акцію поділений на марк-ціну. Розрахунок відбувається о 20:00 ET напередодні ex-дати для акцій США і о 08:00 KST в ex-дату для корейських акцій. Він звільнений від звичайного погодинного ліміту funding, тож лонги завжди отримують повну вартість. За тридцять хвилин до цього вмикається режим reduce-only, а поріг відхилення марк-ціни звужується.\n\nПерелік доступних ринків змінюється, тому актуальні дані — на сторінці специфікацій контрактів.",
      ko: "StandX는 주식 가격을 추종하는 무기한 계약인 Equity Perps도 상장합니다. 공식 문서는 계약을 보유하는 것이 주식을 보유하는 것과 다르다고 분명히 밝힙니다. 소유권도, 의결권도, 주주로서 받는 배당도 없습니다.\n\n배당은 대신 일회성 펀딩 정산으로 처리되어 롱과 숏이 균형을 이룹니다. 롱은 배당에 해당하는 금액을 받고 숏이 이를 지급하며, 거래자 간 직접 이전이라 StandX가 가져가는 수수료는 없습니다. 요율은 -D / M으로, 주당 배당을 마크 가격으로 나눈 값입니다. 정산 시점은 미국 주식이 배당락일 전날 20:00 ET, 한국 주식이 배당락일 당일 08:00 KST입니다. 시간당 펀딩 상한이 적용되지 않아 롱은 항상 전액을 받습니다. 정산 30분 전에는 reduce-only 모드가 켜지고 마크 가격 이탈 허용 범위가 좁아집니다.\n\n상장 시장은 바뀌므로 계약 명세 페이지에서 확인하세요."
    },
    fact: "StandX lists Equity Perps: perpetual contracts tracking stock prices, with no share ownership, voting or shareholder dividend. Dividends settle as a one-time funding adjustment — longs receive a credit equal to the dividend, shorts pay it, peer to peer with no StandX fee, at a rate of -D / M (dividend per share over mark price). Settlement is 20:00 ET the day before the ex-date for US stocks and 08:00 KST on the ex-date for Korean stocks, and is exempt from the hourly funding cap so longs receive the full value. Reduce-only mode activates 30 minutes before settlement and the mark-price deviation threshold tightens. Listed markets change; point to Contract Specifications.",
    docTitles: [
      "Equity Perps: Dividend Adjustment",
      "Contract Specifications",
      "Funding Rate"
    ],
    volatility: "stable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "sips-overview",
    title: "StandX Improvement Proposals",
    aliases: {
      en: ["what are sips", "what is a sip", "sips overview", "standx improvement proposals", "sips"],
      es: ["que son los sips", "que es un sip", "resumen de sips", "propuestas de mejora de standx", "sips"],
      "pt-br": ["o que sao os sips", "o que e um sip", "resumo dos sips", "propostas de melhoria da standx", "sips"],
      uk: ["що таке sips", "що таке sip", "огляд sips", "пропозиції покращення standx", "sips"],
      ko: [
        "sips가 무엇",
        "sip가 무엇",
        "sip란",
        "sip은",
        "sips 개요",
        "standx 개선 제안",
        "sips"
      ]
    },
    answer: {
      en: "SIPs are StandX Improvement Proposals: public documents that explain the motivation, specification, and expected behavior of important protocol changes. Once implemented, they serve as the canonical reference for how that feature should work.\n\nIn practical terms, SIP-1 covers Block Trade, SIP-2 Position Yield, SIP-3 expansion of DUSD native yield, and SIP-4 Block Options. SIP-5 is the broader Universal Markets framework, with SIP-5A for Community Maker Yield and SIP-5B for Community Vaults. The official index currently marks SIP-1 through SIP-4, SIP-5A, and SIP-5B as implemented; SIP-5 remains in progress and SIP-5C is a draft.\n\nThose statuses can change. Tell me which SIP interests you and I can summarize what it actually adds.",
      es: "Los SIPs son las StandX Improvement Proposals: documentos públicos que explican la motivación, especificación y comportamiento esperado de cambios importantes del protocolo. Una vez implementados, funcionan como referencia canónica de cómo debe operar cada función.\n\nEn la práctica, SIP-1 cubre Block Trade; SIP-2, Position Yield; SIP-3, la expansión del rendimiento nativo de DUSD; y SIP-4, Block Options. SIP-5 es el marco más amplio de Universal Markets, con SIP-5A para Community Maker Yield y SIP-5B para Community Vaults. El índice oficial marca actualmente SIP-1 a SIP-4, SIP-5A y SIP-5B como implementados; SIP-5 sigue en progreso y SIP-5C es un borrador.\n\nEsos estados pueden cambiar. Dime qué SIP te interesa y puedo resumirte qué añade realmente.",
      "pt-br": "Os SIPs são as StandX Improvement Proposals: documentos públicos que explicam a motivação, a especificação e o comportamento esperado de mudanças importantes no protocolo. Depois de implementados, servem como referência canônica de como cada recurso deve funcionar.\n\nNa prática, o SIP-1 cobre Block Trade; o SIP-2, Position Yield; o SIP-3, a expansão do rendimento nativo do DUSD; e o SIP-4, Block Options. O SIP-5 é o framework mais amplo de Universal Markets, com o SIP-5A para Community Maker Yield e o SIP-5B para Community Vaults. O índice oficial atualmente marca SIP-1 a SIP-4, SIP-5A e SIP-5B como implementados; o SIP-5 continua em andamento e o SIP-5C é um rascunho.\n\nEsses estados podem mudar. Diga qual SIP interessa e eu resumo o que ele realmente adiciona.",
      uk: "SIP — це StandX Improvement Proposals: публічні документи, що пояснюють мотивацію, специфікацію та очікувану поведінку важливих змін протоколу. Після реалізації вони стають канонічним описом того, як має працювати функція.\n\nНа практиці SIP-1 описує Block Trade, SIP-2 — Position Yield, SIP-3 — розширення нативного доходу DUSD, а SIP-4 — Block Options. SIP-5 є ширшою рамковою системою Universal Markets, де SIP-5A стосується Community Maker Yield, а SIP-5B — Community Vaults. Офіційний індекс наразі позначає SIP-1–SIP-4, SIP-5A і SIP-5B як реалізовані; SIP-5 залишається в роботі, а SIP-5C є чернеткою.\n\nЦі статуси можуть змінюватися. Назвіть SIP, який вас цікавить, і я поясню, що саме він додає.",
      ko: "SIP는 중요한 프로토콜 변경의 동기, 명세, 예상 동작을 설명하는 공개 문서인 StandX Improvement Proposal입니다. 구현된 뒤에는 해당 기능이 어떻게 작동해야 하는지 보여 주는 공식 기준이 됩니다.\n\n구체적으로 SIP-1은 Block Trade, SIP-2는 Position Yield, SIP-3은 DUSD 고유 수익 확장, SIP-4는 Block Options를 다룹니다. SIP-5는 더 넓은 Universal Markets 프레임워크이며, SIP-5A는 Community Maker Yield, SIP-5B는 Community Vaults에 관한 내용입니다. 공식 인덱스는 현재 SIP-1~4, SIP-5A, SIP-5B를 구현 완료로 표시하고, SIP-5는 진행 중, SIP-5C는 초안으로 표시합니다.\n\n상태는 바뀔 수 있습니다. 관심 있는 SIP를 말씀하시면 실제로 무엇이 추가되는지 요약해 드릴게요."
    },
    fact: "SIPs are StandX Improvement Proposals, the public specifications for major protocol features. The official index currently lists SIP-1 through SIP-4 as Implemented, SIP-5 as WIP, SIP-5A and SIP-5B as Implemented, and SIP-5C as Draft. Status is time-sensitive; the live SIP index wins.",
    docTitles: ["SIPs (StandX Improvement Proposals)"],
    volatility: "changeable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "sip-1",
    title: "SIP-1: Block Trade",
    matchPriority: 4,
    aliases: {
      en: ["sip 1", "sip-1", "block trade"],
      es: ["sip 1", "sip-1", "block trade", "operacion en bloque"],
      "pt-br": ["sip 1", "sip-1", "block trade", "negociacao em bloco"],
      uk: ["sip 1", "sip-1", "block trade", "блокова угода"],
      ko: ["sip 1", "sip-1", "블록 트레이드"]
    },
    answer: {
      en: "SIP-1 implements Block Trade for large, privately coordinated Perps trades that settle through StandX. It isolates the negotiated price from the public order book while still applying protocol risk checks and settlement rules.",
      es: "SIP-1 implementa Block Trade para operaciones Perps grandes y coordinadas de forma privada que se liquidan mediante StandX. Aísla el precio negociado del libro público, pero mantiene los controles de riesgo y liquidación del protocolo.",
      "pt-br": "O SIP-1 implementa Block Trade para grandes operações Perps coordenadas de forma privada e liquidadas pela StandX. Ele isola o preço negociado do livro público, mantendo os controles de risco e liquidação do protocolo.",
      uk: "SIP-1 реалізує Block Trade для великих приватно узгоджених Perps-угод із розрахунком через StandX. Узгоджена ціна ізольована від публічної книги ордерів, але перевірки ризику й правила розрахунку протоколу зберігаються.",
      ko: "SIP-1은 비공개로 조율한 대규모 Perps 거래를 StandX에서 결제하는 Block Trade를 구현합니다. 협상 가격은 공개 오더북과 분리되지만 프로토콜의 위험 검증과 결제 규칙은 그대로 적용됩니다."
    },
    fact: "SIP-1 implements Block Trade for large, privately coordinated Perps trades that settle through StandX. Negotiated pricing is isolated from the public order book while protocol risk validation and settlement still apply.",
    docTitles: ["SIP-1: Block Trade"],
    volatility: "stable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "sip-2",
    title: "SIP-2: Position Yield",
    matchPriority: 4,
    aliases: {
      en: ["sip 2", "sip-2", "position yield"],
      es: ["sip 2", "sip-2", "position yield", "rendimiento de posiciones"],
      "pt-br": ["sip 2", "sip-2", "position yield", "rendimento de posicoes"],
      uk: ["sip 2", "sip-2", "position yield", "дохідність позицій"],
      ko: ["sip 2", "sip-2", "포지션 수익"]
    },
    answer: {
      en: "SIP-2 adds Position Yield: a configurable share of eligible protocol fee flow can be distributed to qualifying Perps positions that remain open over time. Eligibility depends on holding duration, risk state, supported markets and other protocol controls; it is not a guaranteed return for every position.",
      es: "SIP-2 añade Position Yield: una parte configurable de los fees elegibles puede distribuirse entre posiciones Perps que permanezcan abiertas y cumplan las reglas. La elegibilidad depende de duración, estado de riesgo, mercados admitidos y otros controles; no es un retorno garantizado para toda posición.",
      "pt-br": "O SIP-2 adiciona Position Yield: uma parcela configurável das taxas elegíveis pode ser distribuída a posições Perps que permaneçam abertas e cumpram as regras. A elegibilidade depende de duração, estado de risco, mercados suportados e outros controles; não é retorno garantido para toda posição.",
      uk: "SIP-2 додає Position Yield: налаштовувана частка придатного потоку комісій може розподілятися між Perps-позиціями, що залишаються відкритими й відповідають правилам. Придатність залежить від тривалості, стану ризику, підтримуваного ринку та інших контролів; це не гарантований дохід для кожної позиції.",
      ko: "SIP-2는 Position Yield를 추가해 적격 프로토콜 수수료 흐름의 설정 가능한 일부를 일정 기간 유지된 적격 Perps 포지션에 배분할 수 있게 합니다. 보유 기간, 위험 상태, 지원 시장 등 조건이 적용되므로 모든 포지션에 수익이 보장되는 것은 아닙니다."
    },
    fact: "SIP-2 implements Position Yield: a configurable portion of eligible protocol fee flow can be allocated to qualifying Perps positions that remain open over time. Eligibility is subject to minimum holding, risk-valid state, enabled markets, rewardable leverage and other controls; it is not a guaranteed return for every position.",
    docTitles: ["SIP-2: Position Yield"],
    volatility: "changeable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "sip-3",
    title: "SIP-3: DUSD Native Yield Expansion",
    matchPriority: 4,
    aliases: {
      en: ["sip 3", "sip-3", "dusd native yield"],
      es: ["sip 3", "sip-3", "rendimiento nativo de dusd"],
      "pt-br": ["sip 3", "sip-3", "rendimento nativo do dusd"],
      uk: ["sip 3", "sip-3", "нативна дохідність dusd"],
      ko: ["sip 3", "sip-3", "dusd 네이티브 수익"]
    },
    answer: {
      en: "SIP-3 routes a configurable portion of net StandX Perps trading-fee revenue into the DUSD yield pool. That layer is additive to DUSD's existing staking and funding sources and is designed to benefit eligible DUSD across supported holding contexts.",
      es: "SIP-3 dirige una parte configurable de los ingresos netos por fees de StandX Perps al fondo de rendimiento de DUSD. Esta capa se suma a las fuentes existentes de staking y funding y busca beneficiar al DUSD elegible en los contextos admitidos.",
      "pt-br": "O SIP-3 direciona uma parcela configurável da receita líquida de taxas da StandX Perps para o pool de rendimento do DUSD. Essa camada se soma às fontes existentes de staking e funding e busca beneficiar DUSD elegível nos contextos suportados.",
      uk: "SIP-3 спрямовує налаштовувану частку чистого доходу від торгових комісій StandX Perps у пул дохідності DUSD. Цей рівень доповнює наявні джерела зі стейкінгу та funding і має охоплювати придатні DUSD у підтримуваних контекстах зберігання.",
      ko: "SIP-3은 StandX Perps의 순 거래 수수료 수익 중 설정 가능한 일부를 DUSD 수익 풀로 보냅니다. 이는 기존 스테이킹·펀딩 수익원에 더해지며 지원되는 보유 환경의 적격 DUSD에 적용되도록 설계됐습니다."
    },
    fact: "SIP-3 implements a configurable revenue route from net StandX Perps trading fees into the DUSD yield pool. This is additive to DUSD's staking and funding sources and applies across eligible supported holding contexts.",
    docTitles: ["SIP-3: DUSD Native Yield Expansion"],
    volatility: "changeable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "sip-4",
    title: "SIP-4: Block Options",
    matchPriority: 4,
    aliases: {
      en: ["sip 4", "sip-4", "block options"],
      es: ["sip 4", "sip-4", "block options", "opciones en bloque"],
      "pt-br": ["sip 4", "sip-4", "block options", "opcoes em bloco"],
      uk: ["sip 4", "sip-4", "block options", "блокові опціони"],
      ko: ["sip 4", "sip-4", "블록 옵션"]
    },
    answer: {
      en: "SIP-4 adds Block Options to position TP/SL flows. A reservation fee buys an American-style right to execute a prearranged Block Trade before expiry; V1 is position-linked protection or exit flexibility, not a general options market.",
      es: "SIP-4 añade Block Options a los flujos TP/SL de posiciones. Una reservation fee compra el derecho de estilo americano a ejecutar un Block Trade acordado antes del vencimiento; V1 ofrece protección o flexibilidad de salida ligada a una posición, no un mercado general de opciones.",
      "pt-br": "O SIP-4 adiciona Block Options aos fluxos de TP/SL de posições. Uma reservation fee compra o direito de estilo americano de executar um Block Trade combinado antes do vencimento; a V1 oferece proteção ou flexibilidade de saída ligada à posição, não um mercado geral de opções.",
      uk: "SIP-4 додає Block Options до сценаріїв TP/SL позиції. Reservation fee купує право американського типу виконати заздалегідь узгоджений Block Trade до завершення строку; V1 дає прив'язаний до позиції захист або гнучкість виходу, а не загальний ринок опціонів.",
      ko: "SIP-4는 포지션 TP/SL 흐름에 Block Options를 추가합니다. 예약 수수료를 내면 만기 전 미리 합의한 Block Trade를 실행할 수 있는 미국식 권리를 얻으며, V1은 일반 옵션 시장이 아니라 포지션 연계 보호·청산 유연성에 한정됩니다."
    },
    fact: "SIP-4 implements Block Options for position TP/SL flows. A reservation fee buys an American-style right to execute a prearranged Block Trade before expiry. V1 is intentionally position-linked and is not a general standardized options market.",
    docTitles: ["SIP-4: Block Options"],
    volatility: "stable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "sip-5",
    title: "SIP-5: Universal Markets",
    matchPriority: 4,
    aliases: {
      en: ["sip 5", "sip-5", "universal markets", "permissionless listing"],
      es: ["sip 5", "sip-5", "universal markets", "listado sin permisos"],
      "pt-br": ["sip 5", "sip-5", "universal markets", "listagem sem permissao"],
      uk: ["sip 5", "sip-5", "universal markets", "бездозвільний лістинг"],
      ko: ["sip 5", "sip-5", "universal markets", "무허가 상장"]
    },
    answer: {
      en: "SIP-5 is the in-progress Universal Markets framework for community-driven market creation. A Market Sponsor proposes and supports a market through reward and shield capital, while public rules, liquidity and risk controls determine whether it can operate.",
      es: "SIP-5 es el marco en progreso de Universal Markets para crear mercados impulsados por la comunidad. Un Market Sponsor propone y respalda el mercado con capital de recompensa y protección, mientras reglas públicas, liquidez y controles de riesgo determinan si puede operar.",
      "pt-br": "O SIP-5 é o framework em andamento de Universal Markets para criação de mercados pela comunidade. Um Market Sponsor propõe e sustenta o mercado com capital de recompensa e proteção, enquanto regras públicas, liquidez e controles de risco determinam se ele pode operar.",
      uk: "SIP-5 — це незавершена система Universal Markets для створення ринків спільнотою. Market Sponsor пропонує й підтримує ринок капіталом винагород і захисту, а публічні правила, ліквідність та контроль ризиків визначають, чи може він працювати.",
      ko: "SIP-5는 커뮤니티 주도 시장 생성을 위한 진행 중인 Universal Markets 프레임워크입니다. Market Sponsor가 보상·보호 자본으로 시장을 제안하고 지원하며, 공개 규칙과 유동성·위험 통제가 운영 가능 여부를 결정합니다."
    },
    fact: "SIP-5 is the in-progress Universal Markets framework for community-driven market creation. A Market Sponsor supports a proposed market through reward and shield capital, while public qualification, liquidity and risk controls govern operation. Do not describe the full permissionless framework as completely launched until the live SIP index says so.",
    docTitles: ["SIP-5: Universal Markets Listing"],
    volatility: "changeable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "sip-5a",
    title: "SIP-5A: Community Maker Yield",
    matchPriority: 6,
    aliases: {
      en: ["sip 5a", "sip-5a", "community maker yield", "maker hours"],
      es: ["sip 5a", "sip-5a", "community maker yield", "maker hours"],
      "pt-br": ["sip 5a", "sip-5a", "community maker yield", "maker hours"],
      uk: ["sip 5a", "sip-5a", "community maker yield", "maker hours"],
      ko: ["sip 5a", "sip-5a", "community maker yield", "maker hours"]
    },
    answer: {
      en: "SIP-5A implements Community Maker Yield: makers earn daily rewards for maintaining qualifying, executable two-sided liquidity near the market. Rewards follow Maker Hours and configurable market parameters, so live campaign rules—not a fixed number—determine qualification and payout.",
      es: "SIP-5A implementa Community Maker Yield: los makers reciben recompensas diarias por mantener liquidez bilateral ejecutable que cumpla las reglas cerca del mercado. Las recompensas siguen Maker Hours y parámetros configurables, así que las reglas vigentes determinan elegibilidad y pago.",
      "pt-br": "O SIP-5A implementa Community Maker Yield: makers recebem recompensas diárias por manter liquidez executável dos dois lados dentro das regras e próxima ao mercado. As recompensas seguem Maker Hours e parâmetros configuráveis, então as regras vigentes determinam elegibilidade e pagamento.",
      uk: "SIP-5A реалізує Community Maker Yield: мейкери отримують щоденні винагороди за придатну виконувану двосторонню ліквідність поблизу ринку. Винагороди залежать від Maker Hours і налаштовуваних параметрів, тому придатність і виплату визначають актуальні правила кампанії.",
      ko: "SIP-5A는 Community Maker Yield를 구현해 시장 근처에 조건을 충족하는 실행 가능한 양방향 유동성을 유지한 maker에게 일일 보상을 제공합니다. 보상은 Maker Hours와 시장별 설정값을 따르므로 고정 수치가 아니라 최신 캠페인 규칙이 자격과 지급액을 결정합니다."
    },
    fact: "SIP-5A implements Community Maker Yield. Makers earn daily rewards for qualifying executable two-sided liquidity, measured through Maker Hours and market-specific configurable parameters. Reward assets can include DUSD, platform-token allocation, or both; the SIP page says the platform token had not yet been issued at the time of writing.",
    docTitles: ["SIP-5A: Community Maker Yield"],
    volatility: "changeable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "sip-5b",
    title: "SIP-5B: Community Vaults",
    matchPriority: 6,
    aliases: {
      en: ["sip 5b", "sip-5b", "community vaults", "strategy vault", "shield vault", "reward vault"],
      es: ["sip 5b", "sip-5b", "community vaults", "strategy vault", "shield vault", "reward vault"],
      "pt-br": ["sip 5b", "sip-5b", "community vaults", "strategy vault", "shield vault", "reward vault"],
      uk: ["sip 5b", "sip-5b", "community vaults", "strategy vault", "shield vault", "reward vault"],
      ko: ["sip 5b", "sip-5b", "community vaults", "strategy vault", "shield vault", "reward vault"]
    },
    answer: {
      en: "SIP-5B implements three Community Vault types: Strategy Vaults delegate trading capital, Reward Vaults fund maker incentives, and Shield Vaults underwrite market-specific tail risk. Each has different return sources, risk rules and withdrawal conditions, so they should not be treated as the same product.",
      es: "SIP-5B implementa tres tipos de Community Vault: Strategy Vaults delegan capital de trading, Reward Vaults financian incentivos para makers y Shield Vaults cubren riesgo extremo por mercado. Cada uno tiene retornos, riesgos y retiros distintos; no son el mismo producto.",
      "pt-br": "O SIP-5B implementa três tipos de Community Vault: Strategy Vaults delegam capital de trading, Reward Vaults financiam incentivos a makers e Shield Vaults cobrem risco extremo por mercado. Cada tipo tem retornos, riscos e saques diferentes; não são o mesmo produto.",
      uk: "SIP-5B реалізує три типи Community Vault: Strategy Vaults делегують торговий капітал, Reward Vaults фінансують стимули мейкерів, а Shield Vaults покривають хвостовий ризик окремого ринку. Джерела доходу, ризики й умови виведення різні, тому це не один продукт.",
      ko: "SIP-5B는 세 가지 Community Vault를 구현합니다. Strategy Vault는 거래 자본을 위임하고, Reward Vault는 maker 인센티브를 지원하며, Shield Vault는 시장별 극단 위험을 인수합니다. 수익원·위험 규칙·출금 조건이 서로 달라 같은 상품으로 보면 안 됩니다."
    },
    fact: "SIP-5B implements three Community Vault types: Strategy Vaults for delegated trading capital, Reward Vaults for maker-incentive budgets, and Shield Vaults for market-specific tail-risk capital. Their return sources, risk rules and exit conditions differ materially.",
    docTitles: ["SIP-5B: Community Vaults"],
    volatility: "changeable",
    verifiedAt: "2026-08-09"
  },
  {
    id: "community-builder",
    title: "Community Builder and Network Yield",
    matchPriority: 5,
    aliases: {
      en: [
        "community builder",
        "network yield",
        "referral",
        "referrals",
        "invite friends",
        "affiliate"
      ],
      es: [
        "community builder",
        "network yield",
        "referidos",
        "programa de referidos",
        "invitar amigos",
        "afiliados"
      ],
      "pt-br": [
        "community builder",
        "network yield",
        "indicacoes",
        "programa de indicacao",
        "convidar amigos",
        "afiliados"
      ],
      uk: [
        "community builder",
        "network yield",
        "реферали",
        "реферальн",
        "рефералів",
        "запросити друзів"
      ],
      ko: ["community builder", "network yield", "레퍼럴", "추천 프로그램", "친구 초대"]
    },
    answer: {
      en: "Community Builder is a Network Yield role for people who want to run their own referral network on StandX — the closest thing the protocol has to a formal role for community organisers.\n\nNetwork Yield is the program underneath it. It activates once your cumulative personal trading volume reaches 500,000 DUSD — your whole history counts, including trades from before the program launched — and then pays a share of the trading fees your network generates: 5% at activation, rising to 10%, 15% and 20% at 2.5M, 7.5M and 15M DUSD of post-launch network volume. You choose how that share splits between yourself and a rebate to the people you invited, and both sides also get a +5% bonus on points.\n\nThe Community Builder role sits on top: one owner can invite up to 10 Builders directly, each of whom can invite unlimited end users, and organise them into Groups with their own yield configuration. You apply by contacting the StandX team, and StandX evaluates Builders against ongoing activity and volume benchmarks. These rates can change, so check the live pages before planning around them.",
      es: "Community Builder es un rol de Network Yield para quien quiera operar su propia red de referidos en StandX: lo más parecido a un rol formal para organizadores de comunidad que tiene el protocolo.\n\nNetwork Yield es el programa que hay debajo. Se activa cuando tu volumen personal acumulado alcanza 500.000 DUSD —cuenta todo tu historial, incluidas operaciones anteriores al lanzamiento del programa— y a partir de ahí paga una parte de las comisiones que genera tu red: 5% al activarse, y 10%, 15% y 20% al llegar a 2,5M, 7,5M y 15M DUSD de volumen de red posterior al lanzamiento. Tú decides cómo se reparte esa parte entre ti y un rebate para quienes invitaste, y ambos lados reciben además un +5% de bonus en puntos.\n\nEl rol de Community Builder se apoya en eso: un titular puede invitar hasta 10 Builders directamente, cada uno puede invitar usuarios finales sin límite, y se organizan en Grupos con su propia configuración de yield. Se solicita contactando al equipo de StandX, y StandX evalúa a los Builders según actividad y volumen sostenidos. Estas tasas pueden cambiar, así que conviene revisar las páginas vigentes.",
      "pt-br": "Community Builder é um papel de Network Yield para quem quer operar a própria rede de indicações na StandX: o mais próximo de um papel formal para organizadores de comunidade que o protocolo tem.\n\nO Network Yield é o programa por trás disso. Ele é ativado quando seu volume pessoal acumulado atinge 500.000 DUSD — todo o histórico conta, inclusive operações anteriores ao lançamento do programa — e passa a pagar uma parte das taxas geradas pela sua rede: 5% na ativação, subindo para 10%, 15% e 20% em 2,5M, 7,5M e 15M DUSD de volume de rede pós-lançamento. Você decide como essa parte se divide entre você e um rebate para quem convidou, e ambos os lados ainda recebem +5% de bônus em pontos.\n\nO papel de Community Builder fica em cima disso: um titular pode convidar até 10 Builders diretamente, cada um podendo convidar usuários finais sem limite, organizados em Grupos com configuração própria de yield. A inscrição é feita entrando em contato com a equipe da StandX, e a StandX avalia os Builders por atividade e volume contínuos. Essas taxas podem mudar, então confira as páginas atuais.",
      uk: "Community Builder — це роль у Network Yield для тих, хто хоче керувати власною реферальною мережею в StandX: найближче до формальної ролі організатора спільноти, що є в протоколі.\n\nNetwork Yield — програма, на якій це побудовано. Вона активується, коли ваш сукупний особистий обсяг торгівлі досягає 500 000 DUSD — враховується вся історія, зокрема угоди до запуску програми — і далі виплачує частку комісій, які генерує ваша мережа: 5% при активації, далі 10%, 15% і 20% на 2,5 млн, 7,5 млн і 15 млн DUSD мережевого обсягу після запуску. Ви самі обираєте, як ця частка ділиться між вами та рібейтом для запрошених, і обидві сторони додатково отримують +5% бонусу до балів.\n\nРоль Community Builder надбудовується згори: власник може запросити до 10 Builders напряму, кожен з них — необмежену кількість кінцевих користувачів, і організувати їх у Groups із власною конфігурацією дохідності. Заявка подається через звернення до команди StandX, і StandX оцінює Builders за поточною активністю та обсягами. Ці ставки можуть змінюватися, тому звіряйтеся з актуальними сторінками.",
      ko: "Community Builder는 StandX에서 자신의 레퍼럴 네트워크를 운영하려는 사람을 위한 Network Yield 역할로, 프로토콜에 있는 가장 공식적인 커뮤니티 운영자 역할입니다.\n\n그 아래에 있는 프로그램이 Network Yield입니다. 누적 개인 거래량이 500,000 DUSD에 도달하면 활성화되며 — 프로그램 출시 이전 거래를 포함한 전체 기록이 반영됩니다 — 이후 네트워크가 만든 거래 수수료의 일부를 지급합니다. 활성화 시 5%이고, 출시 이후 네트워크 거래량이 250만·750만·1,500만 DUSD에 도달하면 각각 10%, 15%, 20%로 올라갑니다. 그 몫을 본인 몫과 초대한 사람에게 주는 리베이트로 어떻게 나눌지 직접 정하며, 양쪽 모두 포인트에 +5% 보너스를 받습니다.\n\nCommunity Builder 역할은 그 위에 얹힙니다. 소유자는 최대 10명의 Builder를 직접 초대할 수 있고, 각 Builder는 최종 사용자를 무제한 초대할 수 있으며, 이들을 자체 수익 설정을 가진 Group으로 묶습니다. 신청은 StandX 팀에 문의해 진행하고, StandX는 지속적인 활동과 거래량 기준으로 Builder를 평가합니다. 이 요율은 변경될 수 있으므로 최신 페이지를 확인하세요."
    },
    fact: "Community Builder is a Network Yield role for community creators running their own referral network on StandX. Network Yield activates at 500,000 DUSD cumulative personal trading volume (full history counts, including pre-launch trades) and pays 5% of referred trading fees, rising to 10%, 15% and 20% at 2.5M, 7.5M and 15M DUSD of post-launch network volume. Participants configure how the yield splits between themselves and a rebate to invitees; both sides also receive a +5% points bonus. A Community Builder owner invites up to 10 Builders directly, each inviting unlimited end users, organised into Groups with their own yield configuration. Applying requires contacting the StandX team, and StandX evaluates Builders against ongoing activity and volume benchmarks. Rates are changeable.",
    docTitles: ["Community Builder", "Network Yield"],
    volatility: "changeable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "standx-points",
    title: "StandX points",
    matchPriority: 5,
    aliases: {
      en: [
        "points",
        "standx points",
        "maker points",
        "trader points",
        "loser points",
        "holder points",
        "how to earn points"
      ],
      es: [
        "puntos",
        "puntos de standx",
        "maker points",
        "trader points",
        "loser points",
        "holder points",
        "como ganar puntos"
      ],
      "pt-br": [
        "pontos",
        "pontos da standx",
        "maker points",
        "trader points",
        "loser points",
        "holder points",
        "como ganhar pontos"
      ],
      uk: [
        "бали",
        "балів",
        "балами",
        "поінти",
        "бали standx",
        "maker points",
        "trader points",
        "як заробити бали"
      ],
      ko: ["포인트", "standx 포인트", "메이커 포인트", "트레이더 포인트", "포인트 획득"]
    },
    answer: {
      en: "StandX runs a points system alongside trading, tracked at standx.com/point. The official Earn docs currently describe four ways to earn.\n\nTrader Points come from trading — the more volume, the more points. Maker Points reward resting limit orders on a linear gradient: the closer the order sits to the mark price, the higher the multiplier, and it has to stay on the book for more than three seconds to count. Loser Points compensate realised losses at 5 points per 1 USD lost. Holder Points accrue at 0.6 point per DUSD per day on DUSD held in the Perps Wallet.\n\nCampaign bonuses and multipliers change often and some are time-limited, so treat those figures as the documented baseline and check the live campaigns page before planning around them.",
      es: "StandX tiene un sistema de puntos paralelo al trading, consultable en standx.com/point. La documentación oficial de Earn describe actualmente cuatro formas de ganarlos.\n\nLos Trader Points vienen del trading: a más volumen, más puntos. Los Maker Points premian las órdenes límite en el libro con un gradiente lineal: cuanto más cerca del precio de marca esté la orden, mayor el multiplicador, y debe permanecer en el libro más de tres segundos para contar. Los Loser Points compensan pérdidas realizadas a razón de 5 puntos por cada 1 USD perdido. Los Holder Points se acumulan a 0,6 puntos por DUSD y día sobre el DUSD que tengas en la Perps Wallet.\n\nLos bonus y multiplicadores de campaña cambian a menudo y algunos son temporales, así que toma esas cifras como la base documentada y revisa la página de campañas vigente antes de planificar.",
      "pt-br": "A StandX mantém um sistema de pontos paralelo ao trading, consultável em standx.com/point. A documentação oficial de Earn descreve atualmente quatro formas de ganhar.\n\nOs Trader Points vêm do trading: quanto mais volume, mais pontos. Os Maker Points premiam ordens limite no livro com um gradiente linear: quanto mais perto do preço de marca, maior o multiplicador, e a ordem precisa permanecer no livro por mais de três segundos para contar. Os Loser Points compensam perdas realizadas à razão de 5 pontos por 1 USD perdido. Os Holder Points acumulam 0,6 ponto por DUSD por dia sobre o DUSD mantido na Perps Wallet.\n\nBônus e multiplicadores de campanha mudam com frequência e alguns são temporários, então trate esses números como a base documentada e confira a página de campanhas atual antes de planejar.",
      uk: "StandX має систему балів паралельно до торгівлі, яку видно на standx.com/point. Офіційна документація Earn наразі описує чотири способи їх заробити.\n\nTrader Points нараховуються за торгівлю: більший обсяг — більше балів. Maker Points винагороджують лімітні ордери в книзі за лінійним градієнтом: що ближче ордер до марк-ціни, то вищий множник, і він має простояти в книзі понад три секунди, щоб зарахуватися. Loser Points компенсують реалізовані збитки за ставкою 5 балів за кожен 1 USD втрат. Holder Points нараховуються по 0,6 бала за DUSD на день за DUSD, що лежить у Perps Wallet.\n\nБонуси та множники кампаній часто змінюються, а деякі обмежені в часі, тож сприймайте ці цифри як задокументовану базу й звіряйтеся з актуальною сторінкою кампаній.",
      ko: "StandX는 거래와 별도로 포인트 시스템을 운영하며 standx.com/point에서 확인할 수 있습니다. 공식 Earn 문서는 현재 네 가지 획득 방법을 설명합니다.\n\nTrader Points는 거래에서 나옵니다. 거래량이 많을수록 더 많이 받습니다. Maker Points는 호가창에 걸어 둔 지정가 주문에 선형 가중치로 보상합니다. 주문이 마크 가격에 가까울수록 배수가 높아지며, 3초를 넘겨 호가창에 남아 있어야 인정됩니다. Loser Points는 실현 손실을 보전해 1 USD 손실당 5포인트를 줍니다. Holder Points는 Perps Wallet에 보유한 DUSD에 대해 하루 DUSD당 0.6포인트가 쌓입니다.\n\n캠페인 보너스와 배수는 자주 바뀌고 일부는 기간 한정이므로, 위 수치는 문서화된 기준선으로 보고 계획 전에 최신 캠페인 페이지를 확인하세요."
    },
    fact: "StandX runs a points system tracked at standx.com/point. The official Earn docs currently describe: Trader Points from trading volume; Maker Points for resting limit orders on a linear proximity gradient to the mark price, requiring the order to rest more than three seconds; Loser Points at 5 points per 1 USD of realised losses; and Holder Points at 0.6 point per DUSD per day for DUSD held in the Perps Wallet. Campaign bonuses and multipliers are frequently time-limited and change; direct visitors to the live campaigns page rather than quoting a bonus.",
    docTitles: [
      "Mainnet Campaigns",
      "Earn on StandX",
      "Earn StandX Points through Swap"
    ],
    volatility: "changeable",
    verifiedAt: "2026-08-14"
  },
  {
    id: "token-tge",
    title: "StandX token and TGE boundary",
    matchPriority: 6,
    aliases: {
      en: ["standx token", "$standx", "tge", "tokenomics", "airdrop", "token launch"],
      es: ["token de standx", "$standx", "tge", "tokenomics", "airdrop", "lanzamiento del token"],
      "pt-br": ["token da standx", "$standx", "tge", "tokenomics", "airdrop", "lancamento do token"],
      uk: ["токен standx", "$standx", "tge", "токеноміка", "airdrop", "запуск токена"],
      ko: ["standx 토큰", "$standx", "tge", "토크노믹스", "에어드롭", "토큰 출시"]
    },
    answer: {
      en: "The official SIP-5A page says the StandX platform token had not yet been issued at the time of writing. I do not have a verified TGE date or complete tokenomics in the approved sources, so I will not speculate; treat official docs and StandX channels as the source of truth for updates.",
      es: "La página oficial de SIP-5A indica que el token de plataforma de StandX aún no se había emitido al momento de escribirla. No tengo una fecha de TGE ni tokenomics completas verificadas en las fuentes aprobadas, así que no especularé; consulta la documentación y canales oficiales.",
      "pt-br": "A página oficial do SIP-5A informa que o token da plataforma StandX ainda não havia sido emitido quando o texto foi publicado. Não há data de TGE nem tokenomics completas verificadas nas fontes aprovadas, então não vou especular; consulte a documentação e os canais oficiais.",
      uk: "Офіційна сторінка SIP-5A зазначає, що на момент написання токен платформи StandX ще не був випущений. У схвалених джерелах немає перевіреної дати TGE чи повної токеноміки, тому я не спекулюватиму; стежте за офіційною документацією та каналами StandX.",
      ko: "공식 SIP-5A 페이지에는 작성 당시 StandX 플랫폼 토큰이 아직 발행되지 않았다고 나옵니다. 승인된 출처에서 확인된 TGE 일정이나 전체 토크노믹스가 없으므로 추측하지 않으며, 공식 문서와 StandX 채널을 기준으로 확인해야 합니다."
    },
    fact: "The official SIP-5A page says the StandX platform token had not yet been issued at the time of writing. The approved source map does not provide a verified TGE date or complete tokenomics. Do not speculate; direct visitors to official StandX documentation and channels for updates.",
    docTitles: ["SIP-5A: Community Maker Yield"],
    volatility: "changeable",
    verifiedAt: "2026-08-14"
  }
] as const satisfies readonly CoreKnowledgeTopic[];

const MATCH_BASE = 4;
const MATCH_THRESHOLD = 7;

export interface KnowledgeMatch {
  topic: CoreKnowledgeTopic;
  score: number;
}

export function normalizeKnowledgeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreAliases(question: string, aliases: readonly string[]): number {
  let best = 0;
  for (const alias of aliases) {
    const needle = normalizeKnowledgeText(alias);
    if (needle.length >= 2 && question.includes(needle)) {
      best = Math.max(best, MATCH_BASE + Math.min(12, needle.length));
    }
  }
  return best;
}

export function matchCoreKnowledge(input: string, locale: AppLocale): KnowledgeMatch | null {
  const question = normalizeKnowledgeText(input);
  if (!question) {
    return null;
  }

  const best = coreKnowledgeTopics
    .map((topic) => {
      const record: CoreKnowledgeTopic = topic;
      return {
        topic: record,
        score:
          scoreAliases(question, record.aliases[locale]) + (record.matchPriority ?? 0)
      };
    })
    .sort((left, right) => right.score - left.score)[0];

  return best && best.score >= MATCH_THRESHOLD ? best : null;
}

export function renderCoreKnowledge(): string {
  return coreKnowledgeTopics
    .map(
      (topic) =>
        `## ${topic.title}\n${topic.fact}\nVerified: ${topic.verifiedAt}. Volatility: ${topic.volatility}. Sources: ${topic.docTitles.join(", ")}.`
    )
    .join("\n\n");
}



/**
 * Curated digest of the official StandX documentation (docs.standx.com).
 *
 * Deliberately NOT a dump of the whole docs site — it rides in the system
 * prompt on every request. It carries (a) enough grounded fact to answer the
 * common questions correctly and (b) the doc URL map so the assistant can
 * always hand off to the authoritative page instead of guessing.
 *
 * Sourced from docs.standx.com. When a number here disagrees with the live
 * docs, the live docs win — the prompt tells the model to say so and link out.
 */

export interface DocEntry {
  title: string;
  url: string;
  /** One line on what the page answers. */
  covers: string;
}

const DOCS_BASE = "https://docs.standx.com";

export const docPages: DocEntry[] = [
  {
    title: "About StandX",
    url: `${DOCS_BASE}/docs/about-standx`,
    covers: "What StandX is, Universal Markets, Universal Yield, the SIP-5 vision"
  },
  {
    title: "$DUSD Overview",
    url: `${DOCS_BASE}/docs/dusd-overview`,
    covers: "What DUSD is, where the yield comes from, why no staking is required"
  },
  {
    title: "DUSD Product FAQ",
    url: `${DOCS_BASE}/docs/dusd-overview/product-faq`,
    covers: "Common DUSD questions"
  },
  {
    title: "DUSD User Guide",
    url: `${DOCS_BASE}/docs/dusd-overview/user-guide`,
    covers: "Step-by-step DUSD usage"
  },
  {
    title: "Minting DUSD",
    url: `${DOCS_BASE}/docs/dusd-solutions/minting-dusd`,
    covers: "How to mint DUSD from USDT/USDC, minimums, fees"
  },
  {
    title: "Redeeming DUSD",
    url: `${DOCS_BASE}/docs/dusd-solutions/redeeming-dusd`,
    covers: "How to redeem DUSD back to collateral"
  },
  {
    title: "DUSD Yielding Circle",
    url: `${DOCS_BASE}/docs/dusd-solutions/dusd-yielding-circle`,
    covers: "How yield is generated and distributed"
  },
  {
    title: "Risks & Hedging System",
    url: `${DOCS_BASE}/docs/dusd-solutions/risks-hedging-system`,
    covers: "Delta-neutral hedging, custody, reserve fund, risk model"
  },
  {
    title: "Key Addresses",
    url: `${DOCS_BASE}/docs/dusd-solutions/key-addresses`,
    covers: "Official contract addresses on BSC and Solana"
  },
  {
    title: "Perps Overview",
    url: `${DOCS_BASE}/docs/standx-perps-overview`,
    covers: "The perps exchange, margin yield, who built it"
  },
  {
    title: "StandX Wallet Guide",
    url: `${DOCS_BASE}/docs/standx-perps-overview/standx-wallet-guide`,
    covers: "Cash Wallet vs Perps Wallet, transferring between them"
  },
  {
    title: "First Perps Trade with Binance Wallet",
    url: `${DOCS_BASE}/docs/standx-perps-overview/how-to-make-your-first-perps-trade-using-binance-wallet`,
    covers: "Complete first-trade walkthrough"
  },
  {
    title: "The Execution Panel",
    url: `${DOCS_BASE}/docs/standx-perps-overview/the-execution-panel`,
    covers: "Placing and managing orders in the UI"
  },
  {
    title: "The Market Monitor",
    url: `${DOCS_BASE}/docs/standx-perps-overview/the-market-monitor`,
    covers: "Reading the market view and order book"
  },
  {
    title: "StandX Vault & SLP",
    url: `${DOCS_BASE}/docs/standx-perps-overview/standx-vault-slp`,
    covers: "The vault, SLP, and how liquidity backstops work"
  },
  {
    title: "Margin & Leverage",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/margin-leverage`,
    covers: "Initial/maintenance margin, cross vs isolated, margin tiers"
  },
  {
    title: "Liquidation",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/liquidation`,
    covers: "When and how positions are liquidated, clearance fee"
  },
  {
    title: "Funding Rate",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/funding-rate`,
    covers: "Funding formula, cadence, caps"
  },
  {
    title: "Trading Fee",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/trading-fee`,
    covers: "Maker and taker fee rates with worked examples"
  },
  {
    title: "Equity Perps: Dividend Adjustment",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/dividend-adjustment`,
    covers: "Stock-tracking perps and how dividends settle between longs and shorts"
  },
  {
    title: "Take Profit and Stop Loss (TP/SL)",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/take-profit-and-stop-loss-orders-tp-sl`,
    covers: "Setting TP/SL orders"
  },
  {
    title: "ADL (Auto-Deleveraging)",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/adl`,
    covers: "What ADL is and when it triggers"
  },
  {
    title: "Price Indicators",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/price-indicators`,
    covers: "Mark price, index price, last price"
  },
  {
    title: "Withdrawal",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/withdrawal`,
    covers: "Withdrawing funds, withdrawal slots, freeing a stuck slot"
  },
  {
    title: "API Token",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/api-token`,
    covers: "Creating and managing API tokens for programmatic access"
  },
  {
    title: "Mobile Mode",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/mobile-mode`,
    covers: "Trading from the mobile interface"
  },
  {
    title: "Position Visibility",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/position-visibility`,
    covers: "Controlling who can see your positions"
  },
  {
    title: "Network Yield",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/network-yield`,
    covers: "The referral program: activation threshold, yield tiers, share rate"
  },
  {
    title: "Community Builder",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/community-builder`,
    covers: "The Network Yield role for community creators running a referral network"
  },
  {
    title: "Block Trade",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/block-trade`,
    covers: "Large off-book trades (SIP-1)"
  },
  {
    title: "Community Vaults",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/community-vaults`,
    covers: "Community-run vaults (SIP-5b)"
  },
  {
    title: "Community Maker Yield",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/community-maker-yield`,
    covers: "Community market making rewards (SIP-5a)"
  },
  {
    title: "Contract Specifications",
    url: `${DOCS_BASE}/docs/standx-perps-solutions/contract-specifications`,
    covers: "Per-market contract specs"
  },
  {
    title: "Earn on StandX",
    url: `${DOCS_BASE}/docs/standx-earn`,
    covers: "Campaigns, points, and LP opportunities"
  },
  {
    title: "Mainnet Campaigns",
    url: `${DOCS_BASE}/docs/standx-earn/mainnet-campaigns`,
    covers: "Active mainnet campaigns, the points types, and how to qualify"
  },
  {
    title: "Earn StandX Points through Swap",
    url: `${DOCS_BASE}/docs/standx-earn/how-to-earn-standx-points-through-swap`,
    covers: "Earning points by swapping"
  },
  {
    title: "Add LP on PancakeSwap V3",
    url: `${DOCS_BASE}/docs/standx-earn/how-to-add-lp-on-pancake-swap-v-3`,
    covers: "Providing DUSD liquidity on PancakeSwap V3"
  },
  {
    title: "Historical Events",
    url: `${DOCS_BASE}/docs/standx-earn/historical-events`,
    covers: "Past campaigns, kept for reference"
  },
  {
    title: "Audits",
    url: `${DOCS_BASE}/docs/resources/audits`,
    covers: "Security audit reports"
  },
  {
    title: "Media Assets",
    url: `${DOCS_BASE}/docs/resources/media-assets`,
    covers: "Official StandX brand and media assets"
  },
  {
    title: "User Terms & Conditions",
    url: `${DOCS_BASE}/docs/resources/user-terms-conditions`,
    covers: "The terms governing use of StandX"
  },
  {
    title: "SIPs (StandX Improvement Proposals)",
    url: `${DOCS_BASE}/sip/sip`,
    covers: "Canonical index and current implementation status of every SIP"
  },
  {
    title: "SIP-1: Block Trade",
    url: `${DOCS_BASE}/sip/sip-1-block-trade`,
    covers: "Large privately coordinated trades with StandX settlement"
  },
  {
    title: "SIP-2: Position Yield",
    url: `${DOCS_BASE}/sip/sip-2-position-yield`,
    covers: "Fee participation for eligible positions held over time"
  },
  {
    title: "SIP-3: DUSD Native Yield Expansion",
    url: `${DOCS_BASE}/sip/sip-3-dusd-native-yield`,
    covers: "Routing a portion of net Perps fee revenue into DUSD yield"
  },
  {
    title: "SIP-4: Block Options",
    url: `${DOCS_BASE}/sip/sip-4-block-options`,
    covers: "Position-linked TP/SL execution rights built on Block Trade"
  },
  {
    title: "SIP-5: Universal Markets Listing",
    url: `${DOCS_BASE}/sip/sip-5-universal-markets-listing`,
    covers: "The in-progress community-driven market-listing framework"
  },
  {
    title: "SIP-5A: Community Maker Yield",
    url: `${DOCS_BASE}/sip/sip-5a-community-maker-yield`,
    covers: "Daily maker rewards measured through qualifying two-sided liquidity"
  },
  {
    title: "SIP-5B: Community Vaults",
    url: `${DOCS_BASE}/sip/sip-5b-community-vault`,
    covers: "Strategy, Reward, and Shield vault specifications"
  },
  {
    title: "API Reference",
    url: `${DOCS_BASE}/standx-api/standx-api`,
    covers: "REST, WebSocket, auth, and rate limits for programmatic trading"
  }
];

/**
 * Prompt digest generated from the same records that power deterministic
 * answers. This prevents the local and model paths from learning different
 * versions of core StandX concepts.
 */
export const standxKnowledge = renderCoreKnowledge();

/**
 * Look a page up by title. Throws rather than returning undefined so a typo or
 * a renamed page fails at module load instead of silently dropping a link.
 */
export function findDoc(title: string): DocEntry {
  const page = docPages.find((entry) => entry.title === title);
  if (!page) {
    throw new Error(`Unknown StandX doc page: ${title}`);
  }
  return page;
}

/** Compact "title — url" list injected into the prompt so links are never invented. */
export function renderDocIndex(): string {
  return docPages
    .map((page) => `- ${page.title} (${page.covers}): ${page.url}`)
    .join("\n");
}
