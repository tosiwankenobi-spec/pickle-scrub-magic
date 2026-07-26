import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SimilarPhotos } from "@/components/pickle/similar";

export const Route = createFileRoute("/similar")({
  head: () => ({
    meta: [
      { title: "Similar Photos — Pickle Polish" },
      {
        name: "description",
        content:
          "Find near-duplicate photos like burst shots, re-compressed shares and edited copies, then clean them safely.",
      },
      { property: "og:title", content: "Similar Photos — Pickle Polish" },
      {
        property: "og:description",
        content: "Group near-duplicate photos by visual similarity and reclaim storage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimilarPage,
});

function SimilarPage() {
  return (
    <AppShell>
      <SimilarPhotos />
    </AppShell>
  );
}
