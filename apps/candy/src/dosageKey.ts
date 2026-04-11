/** 旧数据曾存 "0.25"/"0.5"；i18n 的 t() 按 . 分段，键名不能含小数点 */
export function dosageKeyForI18n(stored: string): string {
  if (stored === '0.25') return 'quarter';
  if (stored === '0.5') return 'half';
  return stored;
}
