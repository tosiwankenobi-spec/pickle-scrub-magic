export type FileType = "image" | "video" | "audio" | "document" | "app";

export type MockFile = {
  id: string;
  name: string;
  type: FileType;
  size: number; // bytes
  location: string;
  modified: string; // ISO
  confidence: number; // 0-1
  recommended?: boolean; // keep this one
  hash: string;
};

export type DuplicateGroup = {
  id: string;
  label: string;
  type: FileType;
  matchType?: "exact" | "similar";
  files: MockFile[];
};

export type CleanupCategory = {
  id: string;
  name: string;
  description: string;
  icon: "trash" | "image" | "video" | "download" | "app" | "cache";
  size: number;
  count: number;
  tint: string; // tailwind class
};

export type HistoryEntry = {
  id: string;
  when: string;
  action: string;
  reclaimed: number;
  files: number;
};

export const TOTAL_STORAGE = 128 * 1024 * 1024 * 1024; // 128 GB
export const USED_STORAGE = 96.4 * 1024 * 1024 * 1024;
export const RECLAIMABLE = 14.2 * 1024 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 || i === 0 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

const MB = 1024 * 1024;

export const duplicateGroups: DuplicateGroup[] = [
  {
    id: "g1",
    label: "Beach sunset burst",
    type: "image",
    files: [
      {
        id: "f1",
        name: "IMG_20250712_193201.jpg",
        type: "image",
        size: 4.2 * MB,
        location: "/DCIM/Camera",
        modified: "2025-07-12T19:32:01Z",
        confidence: 0.99,
        recommended: true,
        hash: "a1b2",
      },
      {
        id: "f2",
        name: "IMG_20250712_193201-edited.jpg",
        type: "image",
        size: 3.9 * MB,
        location: "/Pictures/Edited",
        modified: "2025-07-13T08:11:00Z",
        confidence: 0.97,
        hash: "a1b2",
      },
      {
        id: "f3",
        name: "sunset_copy.jpg",
        type: "image",
        size: 4.2 * MB,
        location: "/Download/WhatsApp Images",
        modified: "2025-07-14T10:02:00Z",
        confidence: 0.98,
        hash: "a1b2",
      },
    ],
  },
  {
    id: "g2",
    label: "Family reunion video",
    type: "video",
    files: [
      {
        id: "f4",
        name: "reunion_4k.mp4",
        type: "video",
        size: 812 * MB,
        location: "/DCIM/Camera",
        modified: "2025-06-04T14:22:00Z",
        confidence: 0.99,
        recommended: true,
        hash: "c3d4",
      },
      {
        id: "f5",
        name: "reunion_4k(1).mp4",
        type: "video",
        size: 812 * MB,
        location: "/Movies",
        modified: "2025-06-05T09:14:00Z",
        confidence: 0.99,
        hash: "c3d4",
      },
    ],
  },
  {
    id: "g3",
    label: "Podcast intro loop",
    type: "audio",
    files: [
      {
        id: "f6",
        name: "intro_v3.wav",
        type: "audio",
        size: 28 * MB,
        location: "/Music/Projects",
        modified: "2025-08-01T11:00:00Z",
        confidence: 0.94,
        recommended: true,
        hash: "e5f6",
      },
      {
        id: "f7",
        name: "intro_v3_backup.wav",
        type: "audio",
        size: 28 * MB,
        location: "/Download",
        modified: "2025-08-01T11:04:00Z",
        confidence: 0.94,
        hash: "e5f6",
      },
      {
        id: "f8",
        name: "intro_final.wav",
        type: "audio",
        size: 27.4 * MB,
        location: "/Music",
        modified: "2025-08-02T13:22:00Z",
        confidence: 0.88,
        hash: "e5f6",
      },
    ],
  },
  {
    id: "g4",
    label: "Rental lease PDF",
    type: "document",
    files: [
      {
        id: "f9",
        name: "lease_2025_signed.pdf",
        type: "document",
        size: 1.8 * MB,
        location: "/Documents",
        modified: "2025-01-15T09:00:00Z",
        confidence: 1,
        recommended: true,
        hash: "g7h8",
      },
      {
        id: "f10",
        name: "lease_2025_signed(1).pdf",
        type: "document",
        size: 1.8 * MB,
        location: "/Download",
        modified: "2025-01-16T09:00:00Z",
        confidence: 1,
        hash: "g7h8",
      },
    ],
  },
];

export const cleanupCategories: CleanupCategory[] = [
  {
    id: "junk",
    name: "Junk & cache",
    description: "App caches, thumbnails, and temp files.",
    icon: "cache",
    size: 3.4 * 1024 * MB,
    count: 8421,
    tint: "bg-primary/10 text-primary",
  },
  {
    id: "screenshots",
    name: "Old screenshots",
    description: "Screenshots older than 90 days.",
    icon: "image",
    size: 1.9 * 1024 * MB,
    count: 612,
    tint: "bg-ocean-700/10 text-ocean-700",
  },
  {
    id: "downloads",
    name: "Stale downloads",
    description: "Files in Download you never opened again.",
    icon: "download",
    size: 2.1 * 1024 * MB,
    count: 178,
    tint: "bg-ocean-500/10 text-ocean-500",
  },
  {
    id: "videos",
    name: "Large videos",
    description: "Videos over 500 MB not opened in 30 days.",
    icon: "video",
    size: 5.6 * 1024 * MB,
    count: 14,
    tint: "bg-ocean-800/10 text-ocean-800",
  },
  {
    id: "apps",
    name: "Unused apps",
    description: "Apps you haven't opened in 60+ days.",
    icon: "app",
    size: 1.2 * 1024 * MB,
    count: 9,
    tint: "bg-primary/10 text-primary",
  },
];

export const initialHistory: HistoryEntry[] = [
  {
    id: "h1",
    when: "2026-07-02T09:12:00Z",
    action: "Cleared cache & junk",
    reclaimed: 2.4 * 1024 * MB,
    files: 4211,
  },
  {
    id: "h2",
    when: "2026-06-18T18:44:00Z",
    action: "Removed duplicate photos",
    reclaimed: 812 * MB,
    files: 46,
  },
  {
    id: "h3",
    when: "2026-05-30T21:03:00Z",
    action: "Deleted stale downloads",
    reclaimed: 1.1 * 1024 * MB,
    files: 92,
  },
];

/* ------------------------------------------------------------------ */
/* Similar photos (near-duplicates, not exact hash matches)            */
/* ------------------------------------------------------------------ */

export const similarGroups: DuplicateGroup[] = [
  {
    id: "s1",
    label: "Rooftop burst — 5 frames",
    type: "image",
    matchType: "similar",
    files: [
      {
        id: "s1f1",
        name: "IMG_20250901_181203.jpg",
        type: "image",
        size: 5.1 * MB,
        location: "/DCIM/Camera",
        modified: "2025-09-01T18:12:03Z",
        confidence: 0.96,
        recommended: true,
        hash: "sim-r1",
      },
      {
        id: "s1f2",
        name: "IMG_20250901_181204.jpg",
        type: "image",
        size: 5.0 * MB,
        location: "/DCIM/Camera",
        modified: "2025-09-01T18:12:04Z",
        confidence: 0.94,
        hash: "sim-r2",
      },
      {
        id: "s1f3",
        name: "IMG_20250901_181205.jpg",
        type: "image",
        size: 4.9 * MB,
        location: "/DCIM/Camera",
        modified: "2025-09-01T18:12:05Z",
        confidence: 0.91,
        hash: "sim-r3",
      },
      {
        id: "s1f4",
        name: "IMG_20250901_181206.jpg",
        type: "image",
        size: 5.0 * MB,
        location: "/DCIM/Camera",
        modified: "2025-09-01T18:12:06Z",
        confidence: 0.88,
        hash: "sim-r4",
      },
    ],
  },
  {
    id: "s2",
    label: "Recompressed shares — city skyline",
    type: "image",
    matchType: "similar",
    files: [
      {
        id: "s2f1",
        name: "skyline_original.jpg",
        type: "image",
        size: 8.4 * MB,
        location: "/Pictures",
        modified: "2025-04-11T20:01:00Z",
        confidence: 0.93,
        recommended: true,
        hash: "sim-c1",
      },
      {
        id: "s2f2",
        name: "IMG-20250412-WA0007.jpg",
        type: "image",
        size: 1.2 * MB,
        location: "/Download/WhatsApp Images",
        modified: "2025-04-12T09:20:00Z",
        confidence: 0.85,
        hash: "sim-c2",
      },
      {
        id: "s2f3",
        name: "skyline_insta.jpg",
        type: "image",
        size: 2.3 * MB,
        location: "/Pictures/Instagram",
        modified: "2025-04-12T11:45:00Z",
        confidence: 0.79,
        hash: "sim-c3",
      },
    ],
  },
  {
    id: "s3",
    label: "Edited portraits — filter variants",
    type: "image",
    matchType: "similar",
    files: [
      {
        id: "s3f1",
        name: "portrait_raw.jpg",
        type: "image",
        size: 6.7 * MB,
        location: "/DCIM/Camera",
        modified: "2025-02-20T15:30:00Z",
        confidence: 0.95,
        recommended: true,
        hash: "sim-p1",
      },
      {
        id: "s3f2",
        name: "portrait_warm.jpg",
        type: "image",
        size: 6.4 * MB,
        location: "/Pictures/Edited",
        modified: "2025-02-20T16:02:00Z",
        confidence: 0.83,
        hash: "sim-p2",
      },
      {
        id: "s3f3",
        name: "portrait_bw.jpg",
        type: "image",
        size: 6.1 * MB,
        location: "/Pictures/Edited",
        modified: "2025-02-20T16:06:00Z",
        confidence: 0.76,
        hash: "sim-p3",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Large files (any type) with adjustable threshold                    */
/* ------------------------------------------------------------------ */

export const LARGE_FILE_THRESHOLDS = [100, 250, 500, 1024] as const;
export type LargeFileThreshold = (typeof LARGE_FILE_THRESHOLDS)[number];

export function thresholdLabel(mb: number): string {
  return mb >= 1024 ? `${mb / 1024} GB+` : `${mb} MB+`;
}

export const largeFiles: MockFile[] = [
  {
    id: "l1",
    name: "hawaii_trip_4k.mov",
    type: "video",
    size: 3.2 * 1024 * MB,
    location: "/DCIM/Camera",
    modified: "2025-05-02T10:00:00Z",
    confidence: 1,
    hash: "lf1",
  },
  {
    id: "l2",
    name: "concert_full_set.mp4",
    type: "video",
    size: 1.7 * 1024 * MB,
    location: "/Movies",
    modified: "2025-03-19T22:10:00Z",
    confidence: 1,
    hash: "lf2",
  },
  {
    id: "l3",
    name: "drone_flyover.mp4",
    type: "video",
    size: 940 * MB,
    location: "/DCIM/Drone",
    modified: "2025-06-11T08:44:00Z",
    confidence: 1,
    hash: "lf3",
  },
  {
    id: "l4",
    name: "GameHub.apk",
    type: "app",
    size: 780 * MB,
    location: "/Download",
    modified: "2025-01-28T13:00:00Z",
    confidence: 1,
    hash: "lf4",
  },
  {
    id: "l5",
    name: "architecture_scans.zip",
    type: "document",
    size: 610 * MB,
    location: "/Documents/Archive",
    modified: "2024-12-04T17:20:00Z",
    confidence: 1,
    hash: "lf5",
  },
  {
    id: "l6",
    name: "panorama_master.tiff",
    type: "image",
    size: 420 * MB,
    location: "/Pictures/RAW",
    modified: "2025-07-09T12:00:00Z",
    confidence: 1,
    hash: "lf6",
  },
  {
    id: "l7",
    name: "podcast_masters.wav",
    type: "audio",
    size: 380 * MB,
    location: "/Music/Projects",
    modified: "2025-08-15T09:30:00Z",
    confidence: 1,
    hash: "lf7",
  },
  {
    id: "l8",
    name: "thesis_final_with_media.pdf",
    type: "document",
    size: 290 * MB,
    location: "/Documents",
    modified: "2025-02-02T19:00:00Z",
    confidence: 1,
    hash: "lf8",
  },
  {
    id: "l9",
    name: "wedding_raw_batch.zip",
    type: "image",
    size: 260 * MB,
    location: "/Pictures/RAW",
    modified: "2024-11-22T15:15:00Z",
    confidence: 1,
    hash: "lf9",
  },
  {
    id: "l10",
    name: "OfflineMaps_EU.obb",
    type: "app",
    size: 180 * MB,
    location: "/Android/obb",
    modified: "2025-04-30T07:05:00Z",
    confidence: 1,
    hash: "lf10",
  },
  {
    id: "l11",
    name: "screen_recording_lecture.mp4",
    type: "video",
    size: 150 * MB,
    location: "/Movies/Recordings",
    modified: "2025-09-12T11:11:00Z",
    confidence: 1,
    hash: "lf11",
  },
  {
    id: "l12",
    name: "family_album_export.zip",
    type: "image",
    size: 120 * MB,
    location: "/Download",
    modified: "2025-05-25T18:40:00Z",
    confidence: 1,
    hash: "lf12",
  },
];

export function largeFilesAbove(thresholdMb: number): MockFile[] {
  const bytes = thresholdMb * MB;
  return largeFiles.filter((f) => f.size >= bytes).sort((a, b) => b.size - a.size);
}
