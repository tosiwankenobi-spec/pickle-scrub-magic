import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Lock,
  Database,
  Copy,
  ShieldCheck,
  History,
  Zap,
  Sparkles,
} from "lucide-react";

export function Roadmap() {
  const items = [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Kotlin + Jetpack Compose",
      body: "Native Android UI, edge-to-edge, Material 3 dynamic color and predictive back.",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Android 13+ READ_MEDIA permissions",
      body: "Granular READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO with per-item picker fallback.",
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "MediaStore scanning",
      body: "Enumerate files via MediaStore.Files and Environment.getExternalStorageDirectory().",
    },
    {
      icon: <Copy className="h-5 w-5" />,
      title: "Duplicate detection pipeline",
      body: "Group by size → sample partial hash (first 64 KB) → verify with full SHA-256.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Safe deletion",
      body: "MediaStore.createDeleteRequest() so the Android system confirms every batch.",
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Local-only cleanup history",
      body: "Room database, on-device. No cloud sync, no accounts, no telemetry.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Background scheduling",
      body: "WorkManager for weekly maintenance scrubs when the phone is idle & charging.",
    },
  ];
  return (
    <div className="space-y-6">
      <Card className="border-yellow-300/60 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="flex gap-3 pt-6 text-sm">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
          <div>
            <div className="font-semibold">This is a web prototype.</div>
            <p className="mt-1 text-muted-foreground">
              A real phone cleanup app needs native Android APIs for MediaStore scanning,
              storage/media permissions, duplicate hashing, and safe deletion. Everything below
              lives outside a browser.
            </p>
          </div>
        </CardContent>
      </Card>
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Native Android roadmap</h1>
        <p className="text-sm text-muted-foreground">
          What Pickle Polish becomes on-device.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.title}>
            <CardContent className="flex items-start gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {i.icon}
              </div>
              <div>
                <div className="font-semibold">{i.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{i.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
