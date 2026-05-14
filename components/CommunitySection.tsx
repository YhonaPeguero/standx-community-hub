import {ArrowUpRight, BookOpen, FileCode, MessageSquareText, Users} from "lucide-react";
import {useTranslations} from "next-intl";
import ScrollRevealImage from "@/components/ScrollRevealImage";

export default function CommunitySection() {
  const t = useTranslations("communitySection");
  const tLinks = useTranslations("links");

  return (
    <div className="section-shell relative" id="community">
      <ScrollRevealImage
        src="/assets/standxtradesantibeard.png"
        alt=""
        width={360}
        height={360}
        direction="right"
        threshold={0.15}
        wrapperClassName="pointer-events-none absolute -bottom-12 -right-16 -z-10 hidden select-none lg:block"
        wrapperStyle={{
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)"
        }}
        className="h-[360px] w-[360px] object-contain opacity-[0.14]"
      />

      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-cyan">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("title")}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5">
          <MessageSquareText className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-text-primary">{t("cards.discord.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {t("cards.discord.description")}
          </p>
          <a
            href={tLinks("discord")}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-cyan px-4 py-2 text-sm font-semibold text-bg-base transition hover:bg-accent-cyanSoft"
          >
            {t("cards.discord.cta")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </article>

        <article className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5">
          <Users className="h-5 w-5 text-accent-gain" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-text-primary">{t("cards.social.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {t("cards.social.description")}
          </p>
          <a
            href={tLinks("standxOfficial")}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-bg-base/60 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-accent-cyan/40 hover:text-accent-cyan"
          >
            {t("cards.social.cta")}
            <ArrowUpRight
              className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]"
              aria-hidden="true"
            />
          </a>
        </article>

        <article className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5" id="resources">
          <BookOpen className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-text-primary">
            {t("cards.resources.title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {t("cards.resources.description")}
          </p>
          <a
            href={tLinks("docs")}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-bg-base/60 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-accent-cyan/40 hover:text-accent-cyan"
          >
            {t("cards.resources.cta")}
            <ArrowUpRight
              className="h-4 w-4 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.45)]"
              aria-hidden="true"
            />
          </a>
        </article>

        <article className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5">
          <FileCode className="h-5 w-5 text-accent-gain" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-text-primary">
            {t("cards.sipGuide.title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {t("cards.sipGuide.description")}
          </p>
          <a
            href="https://standx-sip-guide.vercel.app/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open StandX SIP Visual Guide in a new tab"
            className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-bg-base/60 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-accent-gain/40 hover:text-accent-gain"
          >
            {t("cards.sipGuide.cta")}
            <ArrowUpRight
              className="h-4 w-4 text-accent-gain drop-shadow-[0_0_6px_rgba(0,255,136,0.45)]"
              aria-hidden="true"
            />
          </a>
        </article>
      </div>

      <div className="mt-5 rounded-2xl border border-accent-gain/30 bg-accent-gain/10 px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-gain">
          {t("milestone.label")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">{t("milestone.value")}</p>
      </div>
    </div>
  );
}
