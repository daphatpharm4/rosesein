import Image from "next/image";

type RoseSeinLogoProps = {
  compact?: boolean;
  className?: string;
};

export function RoseSeinLogo({
  compact = false,
  className = "",
}: RoseSeinLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`.trim()}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-lowest/90 shadow-ambient sm:h-11 sm:w-11">
        <Image
          src="/logo-rose-sein.jpg"
          alt=""
          aria-hidden
          width={44}
          height={44}
          className="h-full w-full object-cover"
          priority
        />
      </span>

      <span className={`${compact ? "hidden sm:flex" : "flex"} min-w-0 flex-col`}>
        <span className="font-headline text-[1.08rem] font-extrabold leading-none tracking-[-0.055em]">
          <span className="text-primary">Rose-</span>
          <span className="text-secondary">Sein</span>
        </span>
        {!compact ? (
          <span className="mt-0.5 font-label text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/85">
            Association de lutte contre le cancer du sein
          </span>
        ) : null}
      </span>
    </div>
  );
}
