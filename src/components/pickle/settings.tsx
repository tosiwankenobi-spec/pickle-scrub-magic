import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Video, Music, FileText, Package, Moon, Sun } from "lucide-react";
import { usePickle } from "@/lib/pickle-context";
import { type FileType } from "@/lib/pickle-data";

export function SettingsView() {
  const {
    darkMode,
    setDarkMode,
    minDupSize,
    setMinDupSize,
    enabledTypes,
    setEnabledTypes,
    excluded,
    setExcluded,
    scanDepth,
    setScanDepth,
  } = usePickle();
  const [newExcluded, setNewExcluded] = useState("");

  const types: { id: FileType; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "video", label: "Videos", icon: <Video className="h-4 w-4" /> },
    { id: "audio", label: "Audio", icon: <Music className="h-4 w-4" /> },
    { id: "document", label: "Documents", icon: <FileText className="h-4 w-4" /> },
    { id: "app", label: "App bundles", icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">Tune the optimizer to your preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <div className="font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">Easier on the eyes in low light.</div>
            </div>
          </div>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Duplicate detection</CardTitle>
          <CardDescription>Adjust scan precision and scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <Label>Minimum duplicate size</Label>
              <span className="text-sm font-semibold">{minDupSize} MB</span>
            </div>
            <Slider
              className="mt-2"
              min={0}
              max={100}
              step={1}
              value={[minDupSize]}
              onValueChange={(v) => setMinDupSize(v[0])}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Ignore duplicate files smaller than this.
            </p>
          </div>

          <div>
            <Label>Scan depth</Label>
            <Select value={scanDepth} onValueChange={(v) => setScanDepth(v as typeof scanDepth)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick — size + name (fastest)</SelectItem>
                <SelectItem value="standard">Standard — size + partial hash</SelectItem>
                <SelectItem value="deep">Deep — full SHA-256 verify</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>File types to scan</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {types.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {t.icon} {t.label}
                  </span>
                  <Switch
                    checked={enabledTypes[t.id]}
                    onCheckedChange={(v) => setEnabledTypes((prev) => ({ ...prev, [t.id]: v }))}
                  />
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Excluded folders</CardTitle>
          <CardDescription>Folders the optimizer will never scan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {excluded.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 py-1">
                {p}
                <button
                  onClick={() => setExcluded((prev) => prev.filter((x) => x !== p))}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {excluded.length === 0 && (
              <span className="text-xs text-muted-foreground">No exclusions yet.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="/Path/To/Folder"
              value={newExcluded}
              onChange={(e) => setNewExcluded(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!newExcluded.trim()) return;
                setExcluded((prev) => [...prev, newExcluded.trim()]);
                setNewExcluded("");
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
