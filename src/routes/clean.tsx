import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SmartCleanup } from "@/components/pickle/cleanup";

export const Route = createFileRoute("/clean")({
  component: CleanPage,
});

function CleanPage() {
  return (
    <AppShell>
      <SmartCleanup />
    </AppShell>
  );
}
