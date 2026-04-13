export type Theme = "auto" | "light" | "dark";
export type Language = "cn" | "en";
export type TimeToTake = "breakfast" | "lunch" | "dinner" | "bedtime";

export interface Medication {
  id: string;
  name: string;
  times: TimeToTake[];
  iconType: "emoji" | "image";
  iconValue: string;
  dosage?: string;
  reminderCopy?: string;
}

/** 当前时间 ≥ 预设时间即出现在待服用列表；超过此时长未勾选则自动清除（毫秒） */
export const PENDING_INTAKE_TTL_MS = 6 * 60 * 60 * 1000;

export interface PendingIntakeItem {
  id: string;
  medicationId: string;
  timeSlot: TimeToTake;
  createdAt: number;
}
