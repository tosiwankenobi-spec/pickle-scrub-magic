import picklePolish from "@/assets/pickle-polish.png.asset.json";

export function AnimatedPickleIcon({
  size = 48,
  className = "",
  scanning = false,
}: {
  size?: number;
  className?: string;
  scanning?: boolean;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${scanning ? "animate-polish-scrub" : "animate-polish-bounce"} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={picklePolish.url}
        alt="Pickle polishing itself"
        width={size}
        height={size}
        className={`${scanning ? "animate-polish-pulse" : ""}`}
        style={{ objectFit: "contain" }}
      />
      <div
        className="pointer-events-none absolute inset-0 animate-polish-shine"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 45%, transparent 60%)",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
