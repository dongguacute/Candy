import { invoke, isTauri } from '@tauri-apps/api/core';

/**
 * Android 上通知必须使用已存在的渠道。插件在 Kotlin 里会创建 id=`default` 的渠道；
 * 若使用自定义 channelId 但渠道未成功注册，系统会静默不显示通知。
 * 因此这里统一走默认渠道（不传 channelId）。
 */

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
 * 使用插件原生 notify → Android `show`，走系统通知（默认渠道）。
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
