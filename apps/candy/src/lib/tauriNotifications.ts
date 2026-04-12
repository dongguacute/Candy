import { invoke, isTauri } from '@tauri-apps/api/core';

/**
 * Android 上通知必须使用已存在的渠道。插件在 Kotlin 里会创建 id=`default` 的渠道；
 * 若使用自定义 channelId 但渠道未成功注册，系统会静默不显示通知。
 * 因此这里统一走默认渠道（不传 channelId）。
 */

/** 与 AppContext 时段一一对应，用于取消/覆盖系统闹钟通知（Android AlarmManager） */
export const SLOT_NOTIFICATION_IDS: Record<
  'breakfast' | 'lunch' | 'dinner' | 'bedtime',
  number
> = {
  breakfast: 91001,
  lunch: 91002,
  dinner: 91003,
  bedtime: 91004,
};

/** 划掉后台后进程结束，仅桌面 Tauri 仍可用 JS 轮询；Android/iOS 需走系统定时通知 */
export function isTauriMobileShell(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** 请求通知权限（Tauri / Android 走插件与系统对话框） */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return false;
  const n = await import('@tauri-apps/plugin-notification');
  if (await n.isPermissionGranted()) return true;
  const p = await n.requestPermission();
  return p === 'granted';
}

/** 仅查询是否已授权（定时提醒里不要重复弹窗 request） */
export async function isNotificationPermissionGranted(): Promise<boolean> {
  if (!isTauri()) return false;
  const n = await import('@tauri-apps/plugin-notification');
  return n.isPermissionGranted();
}

/**
 * 立即弹出通知（桌面 Tauri / 测试按钮）。
 */
export async function notifyNative(payload: {
  title: string;
  body?: string;
}): Promise<void> {
  if (!isTauri()) return;
  await invoke('plugin:notification|notify', {
    options: {
      title: payload.title,
      body: payload.body ?? '',
    },
  });
}

/**
 * 取消已注册的闹钟类通知（固定 id）。
 */
export async function cancelNotificationIds(ids: number[]): Promise<void> {
  if (!isTauri() || ids.length === 0) return;
  const { cancel } = await import('@tauri-apps/plugin-notification');
  await cancel(ids);
}

/**
 * 注册「每天在指定时分」触发的系统通知（Android 走 AlarmManager，应用被杀仍可触发）。
 */
export async function scheduleDailyAlarmNotification(options: {
  id: number;
  title: string;
  body: string;
  hour: number;
  minute: number;
}): Promise<void> {
  if (!isTauri()) return;
  const { Schedule } = await import('@tauri-apps/plugin-notification');
  const schedule = Schedule.interval(
    { hour: options.hour, minute: options.minute },
    true
  );
  await invoke('plugin:notification|notify', {
    options: {
      id: options.id,
      title: options.title,
      body: options.body,
      schedule,
    },
  });
}
