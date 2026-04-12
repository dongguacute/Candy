import { invoke, isTauri } from '@tauri-apps/api/core';

/** Android 通知渠道 id（与 createChannel 一致） */
export const TAURI_MEDICATION_CHANNEL_ID = 'medication-reminders';

export async function ensureMedicationNotificationChannel(): Promise<void> {
  if (!isTauri()) return;
  const n = await import('@tauri-apps/plugin-notification');
  const existing = await n.channels();
  if (existing.some((c) => c.id === TAURI_MEDICATION_CHANNEL_ID)) return;
  await n.createChannel({
    id: TAURI_MEDICATION_CHANNEL_ID,
    name: 'Medication reminders',
    description: 'Scheduled dose reminders',
    importance: n.Importance.High,
    visibility: n.Visibility.Private,
    vibration: true,
  });
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
 * 使用插件原生 notify 命令发通知（不要依赖 npm 包里的 sendNotification，其在部分环境下仍走 Web Notification）。
 */
export async function notifyNative(payload: {
  title: string;
  body?: string;
  channelId?: string;
}): Promise<void> {
  if (!isTauri()) return;
  await invoke('plugin:notification|notify', {
    options: {
      title: payload.title,
      body: payload.body,
      channelId: payload.channelId ?? TAURI_MEDICATION_CHANNEL_ID,
    },
  });
}
