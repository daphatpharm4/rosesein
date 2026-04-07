"use client";

import { useEffect, useRef } from "react";

type HomeExperienceProps = {
  children: React.ReactNode;
};

export function HomeExperience({ children }: HomeExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const heroRevealElements = revealElements.filter(
      (element) => element.dataset.reveal === "hero",
    );
    const observedRevealElements = revealElements.filter(
      (element) => element.dataset.reveal !== "hero",
    );

    if (prefersReducedMotion) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
      requestAnimationFrame(() => {
        heroRevealElements.forEach((element) => element.classList.add("is-visible"));
      });
    }

    let observer: IntersectionObserver | null = null;

    if (!prefersReducedMotion) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!(entry.target instanceof HTMLElement) || !entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          });
        },
        {
          rootMargin: "0px 0px -12% 0px",
          threshold: 0.18,
        },
      );

      observedRevealElements.forEach((element) => observer?.observe(element));
    } else {
      observedRevealElements.forEach((element) => element.classList.add("is-visible"));
    }

    const heroSurface = root.querySelector<HTMLElement>("[data-home-hero]");
    let frameId = 0;

    if (heroSurface && !prefersReducedMotion) {
      let nextSpotX = 74;
      let nextSpotY = 26;
      let nextDrift = Math.min(window.scrollY * 0.06, 44);

      const commitMotionFrame = () => {
        frameId = 0;
        heroSurface.style.setProperty("--hero-spot-x", `${nextSpotX}%`);
        heroSurface.style.setProperty("--hero-spot-y", `${nextSpotY}%`);
        heroSurface.style.setProperty("--hero-drift", `${nextDrift}px`);
      };

      const scheduleMotionFrame = () => {
        if (!frameId) {
          frameId = window.requestAnimationFrame(commitMotionFrame);
        }
      };

      const handlePointerMove = (event: PointerEvent) => {
        const rect = heroSurface.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }

        nextSpotX = Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 10), 90);
        nextSpotY = Math.min(Math.max(((event.clientY - rect.top) / rect.height) * 100, 12), 88);
        scheduleMotionFrame();
      };

      const resetPointer = () => {
        nextSpotX = 74;
        nextSpotY = 26;
        scheduleMotionFrame();
      };

      const handleScroll = () => {
        nextDrift = Math.min(window.scrollY * 0.06, 44);
        scheduleMotionFrame();
      };

      heroSurface.addEventListener("pointermove", handlePointerMove);
      heroSurface.addEventListener("pointerleave", resetPointer);
      window.addEventListener("scroll", handleScroll, { passive: true });
      scheduleMotionFrame();

      return () => {
        observer?.disconnect();
        heroSurface.removeEventListener("pointermove", handlePointerMove);
        heroSurface.removeEventListener("pointerleave", resetPointer);
        window.removeEventListener("scroll", handleScroll);

        if (frameId) {
          window.cancelAnimationFrame(frameId);
        }
      };
    }

    return () => {
      observer?.disconnect();

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div ref={rootRef} className="home-experience">
      {children}
    </div>
  );
}
