/**
 * 學校名稱映射常量
 * School name to CSS class mapping constants
 */

/**
 * 學校名稱類型（中文）
 */
export type SchoolNameZh = "青葉城西" | "烏野" | "音駒" | "梟谷" | "混合學校";

/**
 * 學校 CSS Class 類型
 */
export type SchoolClass =
  | "seijoh"
  | "karasuno"
  | "nekoma"
  | "fukurodani"
  | "mixed";

/**
 * 學校名稱（中文）到 CSS Class 的映射表
 * Maps Chinese school names to their corresponding CSS class names
 *
 * @example
 * ```ts
 * import { SCHOOL_CLASS_MAP, getSchoolClass } from '@/constants/schools';
 *
 * const cssClass = SCHOOL_CLASS_MAP["烏野"]; // "karasuno"
 * // or use the helper function:
 * const cssClass2 = getSchoolClass("烏野"); // "karasuno"
 * ```
 */
export const SCHOOL_CLASS_MAP: Record<SchoolNameZh, SchoolClass> = {
  青葉城西: "seijoh",
  烏野: "karasuno",
  音駒: "nekoma",
  梟谷: "fukurodani",
  混合學校: "mixed",
} as const;

/**
 * 學校英文代碼到中文名稱的反向映射
 * Reverse mapping from CSS class to Chinese school name
 */
export const SCHOOL_NAME_MAP: Record<SchoolClass, SchoolNameZh> = {
  seijoh: "青葉城西",
  karasuno: "烏野",
  nekoma: "音駒",
  fukurodani: "梟谷",
  mixed: "混合學校",
} as const;

/**
 * 預設學校
 * Default school
 */
export const DEFAULT_SCHOOL: SchoolNameZh = "烏野";
export const DEFAULT_SCHOOL_CLASS: SchoolClass = "karasuno";

/**
 * 所有支援的學校列表（中文名稱）
 * List of all supported schools (Chinese names)
 */
export const SUPPORTED_SCHOOLS: readonly SchoolNameZh[] = [
  "青葉城西",
  "烏野",
  "音駒",
  "梟谷",
  "混合學校",
] as const;

/**
 * 所有支援的學校 CSS Class 列表
 * List of all supported school CSS classes
 */
export const SUPPORTED_SCHOOL_CLASSES: readonly SchoolClass[] = [
  "seijoh",
  "karasuno",
  "nekoma",
  "fukurodani",
  "mixed",
] as const;

/**
 * 學校中文名稱轉換為 CSS Class
 * Convert Chinese school name to CSS class
 *
 * @param schoolName - 學校中文名稱
 * @returns CSS class name，如果找不到則返回預設值
 *
 * @example
 * ```ts
 * getSchoolClass("烏野"); // "karasuno"
 * getSchoolClass("未知學校"); // "karasuno" (default)
 * ```
 */
export function getSchoolClass(schoolName: string): SchoolClass {
  return SCHOOL_CLASS_MAP[schoolName as SchoolNameZh] || DEFAULT_SCHOOL_CLASS;
}

/**
 * 檢查是否為有效的學校名稱
 * Check if a school name is valid
 *
 * @param schoolName - 要檢查的學校名稱
 * @returns 是否為有效學校名稱
 */
export function isValidSchoolName(
  schoolName: string
): schoolName is SchoolNameZh {
  return schoolName in SCHOOL_CLASS_MAP;
}

/**
 * CSS Class 轉換為學校中文名稱
 * Convert CSS class to Chinese school name
 *
 * @param schoolClass - CSS class name
 * @returns 學校中文名稱，如果找不到則返回預設值
 */
export function getSchoolName(schoolClass: string): SchoolNameZh {
  return SCHOOL_NAME_MAP[schoolClass as SchoolClass] || DEFAULT_SCHOOL;
}
