import placeholderimg from "@/assets/placeholderimg.png";

type MediaSlotProps = {
  /** Show the elephant placeholder image instead of an empty placeholder. */
  sample?: boolean;
  alt: string;
  className?: string;
};

export function MediaSlot({ sample = false, alt, className = "" }: MediaSlotProps) {
  if (sample) {
    return (
      <img
        src={placeholderimg}
        alt={alt}
        loading="lazy"
        width={808}
        height={863}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label="Waiting for user upload"
      className={`flex items-center justify-center bg-muted ${className}`}
    >
      <span className="px-3 text-center text-[0.65rem] font-bold uppercase leading-tight tracking-[0.2em] text-muted-foreground">
        Waiting for
        <br />
        user upload
      </span>
    </div>
  );
}
