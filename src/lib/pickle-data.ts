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
