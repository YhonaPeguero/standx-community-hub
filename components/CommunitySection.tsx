import {ArrowUpRight, BookOpen, FileCode, MessageSquareText, Users} from "lucide-react";
import {useTranslations} from "next-intl";

export default function CommunitySection() {
  const t = useTranslations("communitySection");
  const tLinks = useTranslations("links");

  return (
    <section className="section-shell border-b border-border-hairline py-16 md:py-24" id="community">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div className="space-y-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="text-display-md uppercase text-text-primary">{t("title")}</h2>
        </div>
        <p className="text-base leading-relaxed text-text-secondary md:text-lg">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 border border-border-hairline md:grid-cols-2 lg:grid-cols-4">
        <CommunityCard
          number="01"
          icon={MessageSquareText}
          title={t("cards.discord.title")}
          description={t("cards.discord.description")}
          ctaLabel={t("cards.discord.cta")}
          href={tLinks("discord")}
          className="border-border-hairline border-b lg:border-b-0 lg:border-r"
        />
        <CommunityCard
          number="02"
          icon={Users}
          title={t("cards.social.title")}
          description={t("cards.social.description")}
          ctaLabel={t("cards.social.cta")}
          href={tLinks("standxOfficial")}
          className="border-border-hairline border-b md:border-b-0 md:border-l lg:border-l-0 lg:border-r"
        />
        <CommunityCard
          number="03"
          icon={BookOpen}
          title={t("cards.resources.title")}
          description={t("cards.resources.description")}
          ctaLabel={t("cards.resources.cta")}
          href={tLinks("docs")}
          id="resources"
          className="border-border-hairline border-b md:border-r lg:border-b-0"
        />
        <CommunityCard
          number="04"
          icon={FileCode}
          title={t("cards.sipGuide.title")}
          description={t("cards.sipGuide.description")}
          ctaLabel={t("cards.sipGuide.cta")}
          href="https://standx-sip-guide.vercel.app/"
        />
      </div>

      <div className="mt-6 border border-accent-lime/40 p-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widepill text-accent-lime">
          {t("milestone.label")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">{t("milestone.value")}</p>
      </div>
    </section>
  );
}

interface CommunityCardProps {
  number: string;
  icon: typeof MessageSquareText;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  id?: string;
  className?: string;
}

function CommunityCard({
  number,
  icon: Icon,
  title,
  description,
  ctaLabel,
  href,
  id,
  className = ""
}: CommunityCardProps) {
  return (
    <article id={id} className={`group flex flex-col gap-4 p-6 transition-colors hover:bg-bg-elevated ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
          {number}
        </span>
        <Icon className="h-4 w-4 text-text-secondary group-hover:text-accent-lime" aria-hidden="true" />
      </div>
      <h3 className="font-mono text-base font-semibold uppercase tracking-widepill text-text-primary">
        {title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-text-secondary">{description}</p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex min-h-9 items-center justify-between gap-2 border border-border-base px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widepill text-text-primary transition hover:border-accent-lime hover:text-accent-lime"
      >
        {ctaLabel}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </article>
  );
}
