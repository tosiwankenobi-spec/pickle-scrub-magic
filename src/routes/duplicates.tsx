import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Duplicates } from "@/components/pickle/duplicates";

export const Route = createFileRoute("/duplicates")({
  component: DuplicatesPage,
});

function DuplicatesPage() {
  return (
    <AppShell>
      <Duplicates />
    </AppShell>
  );
}
