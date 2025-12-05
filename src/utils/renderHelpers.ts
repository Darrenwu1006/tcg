/**
 * 渲染輔助函數
 * Rendering helper functions for UI components
 */

/**
 * 渲染方塊狀態條
 * Renders a block bar visualization for stat values
 *
 * @param value - 數值 (0-6)，null 會顯示 "-"，undefined 視為 0
 * @param showValue - 是否顯示數值文字，默認為 false
 * @returns HTML 字符串
 *
 * @example
 * ```ts
 * import { renderBlockBar } from '@/utils/renderHelpers';
 *
 * // 只顯示方塊
 * const html1 = renderBlockBar(3); // 3個實心方塊 + 3個空心方塊
 * const html2 = renderBlockBar(null); // 6個空心方塊
 *
 * // 顯示方塊和數值
 * const html3 = renderBlockBar(5, true); // 5個實心方塊 + 1個空心方塊 + "5"
 * const html4 = renderBlockBar(null, true); // 6個空心方塊 + "-"
 * ```
 */
export function renderBlockBar(
  value: number | null | undefined,
  showValue: boolean = false
): string {
  // null 表示該卡片沒有此屬性，顯示為 "-"
  // undefined 視為 0（向後兼容）
  const isNull = value === null;
  const val = isNull ? 0 : value ?? 0;
  const maxBlocks = 6;
  const filledBlocks = Math.min(Math.max(val, 0), maxBlocks);
  const emptyBlocks = maxBlocks - filledBlocks;

  let blocksHtml = '<div class="block-bar-container">';
  for (let i = 0; i < filledBlocks; i++) {
    blocksHtml += '<div class="block filled"></div>';
  }
  for (let i = 0; i < emptyBlocks; i++) {
    blocksHtml += '<div class="block empty"></div>';
  }
  blocksHtml += "</div>";

  // 如果需要顯示數值，添加數值標籤
  if (showValue) {
    const displayValue = isNull ? "-" : val.toString();
    return `${blocksHtml} <span class="block-value">${displayValue}</span>`;
  }

  return blocksHtml;
}

/**
 * 最大方塊數量常量
 * Maximum number of blocks in a block bar
 */
export const MAX_BLOCKS = 6;
