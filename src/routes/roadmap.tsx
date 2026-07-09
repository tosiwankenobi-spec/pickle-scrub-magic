import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Roadmap } from "@/components/pickle/roadmap";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  return (
    <AppShell>
      <Roadmap />
    </AppShell>
  );
}
