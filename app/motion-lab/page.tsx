import type {Metadata} from "next";
import {notFound} from "next/navigation";
import MotionLab from "@/components/motion-lab/MotionLab";

/**
 * `/motion-lab` — the character motion isolation rig.
 *
 * Deliberately outside `app/[locale]`: it is a developer tool, not site
 * content, so it needs no translation and must stay out of the locale x section
 * static matrix. `middleware.ts` excludes the path from the next-intl redirect.
 *
 * Off in production unless `NEXT_PUBLIC_MOTION_LAB=1`, so a Vercel preview can
 * turn it on for a review without it being reachable on the live hub.
 */

export const metadata: Metadata = {
  title: "Motion lab",
  robots: {index: false, follow: false}
};

export default function MotionLabPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_MOTION_LAB !== "1"
  ) {
    notFound();
  }

  return <MotionLab />;
}
