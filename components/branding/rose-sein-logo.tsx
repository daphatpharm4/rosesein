import { useId } from "react";

type RoseSeinLogoProps = {
  compact?: boolean;
  className?: string;
};

export function RoseSeinLogo({
  compact = false,
  className = "",
}: RoseSeinLogoProps) {
  const gradientId = useId();
  const sweepId = useId();

  return (
    <div className={`flex items-center gap-2.5 ${className}`.trim()}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/92 shadow-ambient sm:h-11 sm:w-11">
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9"
          fill="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="14" y1="16" x2="34" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgb(var(--color-primary-container))" />
              <stop offset="0.5" stopColor="rgb(var(--color-primary))" />
              <stop offset="1" stopColor="rgb(var(--color-primary-fixed-dim))" />
            </linearGradient>
            <linearGradient id={sweepId} x1="30" y1="8" x2="56" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgb(var(--color-primary-container))" />
              <stop offset="0.55" stopColor="rgb(var(--color-secondary))" />
              <stop offset="1" stopColor="rgb(var(--color-secondary-container-strong))" />
            </linearGradient>
          </defs>

          <path
            d="M19 14c4.8-4.4 11.2-7 18.1-7 8 0 15.5 3.5 20.5 9.8 4.7 5.8 6.4 13.4 4.9 20.6-1.6 7.5-6.6 14.4-13.7 18.2-4 2.1-8.4 3.2-12.8 3.2"
            stroke={`url(#${sweepId})`}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M16 18c4.6 6.2 8.3 12.5 10.9 18.8 1.5 3.6 2.2 6.6 1.3 9.2-.8 2.2-2.7 4.1-5.1 4.9-2.8.9-6 .3-8.1-1.6-2.4-2.1-3.5-5.6-2.8-8.8 1-4.3 4.5-7.4 7.8-10.1 3.7-3 7.6-6 9.8-10.4"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 18 10 26.2"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M18.2 44.7 13 55"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className={`${compact ? "hidden sm:flex" : "flex"} min-w-0 flex-col`}>
        <span className="font-headline text-[1.02rem] font-extrabold leading-none tracking-[-0.055em]">
          <span className="text-primary">Rose-</span>
          <span className="text-secondary">Sein</span>
        </span>
        {!compact ? (
          <span className="mt-0.5 font-label text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/85">
            Association de lutte contre le cancer du sein
          </span>
        ) : null}
      </span>
    </div>
  );
}
