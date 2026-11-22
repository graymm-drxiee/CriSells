import type { CameraCategory } from "./types";

export const categories: { label: string; value: CameraCategory | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Mirrorless", value: "Mirrorless" },
  { label: "DSLR", value: "DSLR" },
  { label: "Cinema", value: "Cinema" },
  { label: "Drones", value: "Drone" },
  { label: "Action", value: "Action" },
  { label: "Film", value: "Film" },
];
