import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HistoryView } from "@/components/pickle/history";
import { usePickle } from "@/lib/pickle-context";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { history } = usePickle();
  return (
    <AppShell>
      <HistoryView entries={history} />
    </AppShell>
  );
}
