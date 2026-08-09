"use client";

import {usePathname} from "next/navigation";
import type {ReactNode} from "react";

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Replays the site's entrance animation on every client-side navigation.
 *
 * `app/[locale]/layout.tsx` is not re-rendered when the visitor moves between
 * sibling routes, so the wrapper has to read the pathname on the client and use
 * it as a `key` — that is what remounts the subtree and restarts the animation.
 * Children are still whatever the server sent; passing them straight through
 * keeps them server components.
 *
 * The animation itself is CSS (`.route-fade`), not framer-motion, for two
 * reasons: a framer `initial` renders as `opacity: 0` inline and would leave
 * the page permanently blank if hydration never happened, and the
 * reduced-motion path belongs in the `prefers-reduced-motion` block with every
 * other one rather than in a hook that branches the rendered tree.
 */
export default function RouteTransition({children}: RouteTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="route-fade">
      {children}
    </div>
  );
}
