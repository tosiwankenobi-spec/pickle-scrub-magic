import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cleanupCategories, formatBytes } from "@/lib/pickle-data";
import { usePickle } from "@/lib/pickle-context";
import { Wind as BroomIcon } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/pickle/shared";

export function SmartCleanup() {
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(["junk", "screenshots"]));
  const toggle = (id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const total = cleanupCategories
    .filter((c) => selectedCats.has(c.id))
    .reduce((n, c) => n + c.size, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl font-display">Smart Cleanup</h1>
        <p className="text-sm text-muted-foreground">
          Select categories to reclaim space safely.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cleanupCategories.map((c) => {
          const active = selectedCats.has(c.id);
          return (
            <Card
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`cursor-pointer transition ${
                active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
              }`}
            >
              <CardContent className="flex items-start gap-4 pt-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.tint}`}>
                  <CategoryIcon icon={c.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold font-display">{c.name}</h3>
                    <Checkbox checked={active} onCheckedChange={() => toggle(c.id)} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.count.toLocaleString()} items</span>
                    <span className="font-semibold text-primary">{formatBytes(c.size)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Selected categories
            </div>
            <div className="text-2xl font-bold text-primary font-display">{formatBytes(total)}</div>
          </div>
          <Button
            className="gap-2"
            disabled={selectedCats.size === 0}
            onClick={() =>
              toast.success("Cleanup queued", {
                description: `Will reclaim ${formatBytes(total)} across ${selectedCats.size} categor${selectedCats.size === 1 ? "y" : "ies"}.`,
              })
            }
          >
            <BroomIcon className="h-4 w-4" />
            Clean selected
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
