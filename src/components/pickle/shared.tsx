import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Download,
  Package,
  Trash2,
  Wind,
  Smartphone,
} from "lucide-react";
import { formatBytes, type FileType, type CleanupCategory } from "@/lib/pickle-data";

export function FileIcon({ type }: { type: FileType }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "image":
      return <ImageIcon className={cls} />;
    case "video":
      return <Video className={cls} />;
    case "audio":
      return <Music className={cls} />;
    case "document":
      return <FileText className={cls} />;
    case "app":
      return <Package className={cls} />;
  }
}

export function CategoryIcon({ icon }: { icon: CleanupCategory["icon"] }) {
  switch (icon) {
    case "trash":
      return <Trash2 className="h-5 w-5" />;
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
    case "download":
      return <Download className="h-5 w-5" />;
    case "app":
      return <Smartphone className="h-5 w-5" />;
    case "cache":
      return <Wind className="h-5 w-5" />;
  }
}

export function CountUpBytes({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{formatBytes(n)}</>;
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
