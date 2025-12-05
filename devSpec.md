# devSpec - 開發規格文檔

> 📅 **最後更新**: 2025-12-05  
> 🎯 **目標**: 提升代碼質量、可維護性與性能

---

## 📋 待開發項目 (Pending Tasks)

### 🟡 中優先級 (Medium Priority)

#### 4. **PlayerZone.ts 文件過大** 🔜 **下週處理**

- **文件**: `src/components/PlayerZone.ts` (1444 行, 47KB)
- **問題**:
  - 單個文件包含太多職責
  - `setupGlobalDragSelection` (150 行)
  - `renderExpandedOverlay` (252 行)
  - 多個更新函數
- **影響**: 難以維護、測試和導航
- **建議**: 拆分為多個文件:
  - `PlayerZone.ts` (主邏輯)
  - `DragSelection.ts` (拖拽選擇邏輯)
  - `ExpandedOverlay.ts` (展開視圖)
  - `CardUpdaters.ts` (卡片更新邏輯)
- **工作量**: 3-4 小時

#### 5. **未使用的狀態屬性** 🔜 **下週處理**

- **文件**: `src/state/Store.ts`
- **問題**: 可能還有其他未使用的屬性需要檢查
- **影響**: 佔用內存，混淆開發者
- **建議**: 全面審查並移除或註釋未使用屬性
- **工作量**: 15-30 分鐘

#### 6. **事件監聽器重複綁定** 🔜 **下週處理**

- **文件**: `src/components/PlayerZone.ts` - `setupGlobalDragSelection`
- **問題**:
  - 每個 PlayerZone 實例都會綁定 document 級別的事件
  - 創建兩個實例(me & opponent)導致監聽器重複
- **影響**: 性能下降，可能的內存洩漏
- **建議**: 將全局監聽器移到 `GameBoard` 或 `main.ts`
- **工作量**: 1-2 小時

### 🟢 低優先級 (Low Priority)

#### 7. **過度使用類型斷言 (as any)**

- **文件**: `src/components/PlayerZone.ts` (多處)
- **問題**: 使用 `as any` 繞過類型檢查
- **影響**: 失去 TypeScript 類型安全優勢
- **建議**: 重構狀態更新邏輯，使用正確的類型
- **工作量**: 2-3 小時

#### 8. **Magic Numbers 硬編碼**

- **位置**:
  - `Store.ts` Line 74: `MAX_HISTORY = 20`
  - `Store.ts` Line 130: `slice(0, 50)` (logs 上限)
  - 其他分散的魔術數字
- **建議**: 提取為配置常量 (`src/constants/config.ts`)
- **工作量**: 30 分鐘

#### 9. **CSS Class 字符串硬編碼**

- **文件**: 所有組件文件
- **問題**: CSS class 名稱散落在代碼各處
- **建議**: 使用常量或枚舉集中管理
- **工作量**: 1-2 小時

---

## ✅ 已完成項目 (Completed Tasks)

### TypeScript 代碼優化 (2025-12-05)

#### ~~1. 數據結構重複定義問題~~ ✅

- **文件**: `src/state/Store.ts`
- **完成內容**:
  - ✅ 創建統一的 `Stats` 和 `CardStats` 介面
  - ✅ `CardStats`: 卡片固有屬性（可為 null）
  - ✅ `Stats`: 聚合統計結果（number）
  - ✅ 更新 `Card.stats` 使用 `CardStats` 類型
  - ✅ 更新 `PlayerState.currentStats` 使用 `Stats` 類型
  - ✅ 移除未使用的 `AppState.count` 屬性
  - ✅ 更新 `main.ts` 移除 count 初始化
  - ✅ 通過 TypeScript 編譯驗證
- **效益**: 提升類型安全，澄清數據結構語義，移除死代碼

#### ~~2. 重複的工具函數 - renderBlockBar~~ ✅

- **文件**: `src/components/Card.ts`, `CardDetailPanel.ts` → `src/utils/renderHelpers.ts`
- **完成內容**:
  - ✅ 創建 `src/utils/renderHelpers.ts` 共用工具文件
  - ✅ 統一使用 `maxBlocks=6`
  - ✅ 提供可選參數 `showValue` 控制數值顯示
  - ✅ null 值顯示為 "-" 而非 "0"
  - ✅ 重構 `Card.ts` 移除重複代碼
  - ✅ 重構 `CardDetailPanel.ts` 使用 `showValue=true` 顯示數值
  - ✅ 添加完整 JSDoc 文檔
- **效益**: 減少代碼重複，統一渲染邏輯，易於維護

#### ~~3. 學校名稱映射重複~~ ✅

- **文件**: `src/components/Card.ts` → `src/constants/schools.ts`
- **完成內容**:
  - ✅ 創建 `src/constants/schools.ts` 集中管理學校映射
  - ✅ 新增 TypeScript 類型定義 (`SchoolNameZh`, `SchoolClass`)
  - ✅ 提供輔助函數 (`getSchoolClass()`, `getSchoolName()`, `isValidSchoolName()`)
  - ✅ 重構 `Card.ts` 移除重複代碼
  - ✅ 更新文檔到 `devSpec.md`
- **效益**: 新增學校時只需更新一個文件，避免遺漏

### UI 改進 (2025-12-05)

#### ~~Null 值顯示優化~~ ✅

- **文件**: `src/utils/renderHelpers.ts`
- **問題**: 卡片能力值為 null 時顯示 "0"，容易與真正的 0 混淆
- **完成內容**:
  - ✅ 修改 `renderBlockBar` 函數
  - ✅ null 值顯示為 "-" 而非 "0"
  - ✅ 空心方塊保持未填色（表示該卡片沒有此屬性）
  - ✅ 更新 JSDoc 文檔說明新行為
- **效益**: 提升數據可讀性，清楚區分「無此屬性」和「數值為 0」
- **影響範圍**:
  - ✅ CardDetailPanel 中的卡片詳情顯示
  - ✅ 所有使用 `renderBlockBar(value, true)` 的地方

### ✅ 已確認的良好實踐

- ✅ 使用 TypeScript 接口定義
- ✅ 實現 Store 模式進行狀態管理
- ✅ 組件職責相對清晰
- ✅ 使用 Singleton 模式 (CardDatabase)
- ✅ 實現歷史記錄功能 (undo)
- ✅ 良好的訂閱/通知模式

---

## 開發指南 (Development Guide)

### 學校映射系統 (School Mapping System)

#### 概述 (Overview)

為了提升代碼可維護性並避免重複定義，我們將所有學校相關的映射邏輯集中在 `src/constants/schools.ts` 文件中。

#### 支援的學校 (Supported Schools)

| 中文名稱 | CSS Class    | 英文名稱   |
| -------- | ------------ | ---------- |
| 青葉城西 | `seijoh`     | Seijoh     |
| 烏野     | `karasuno`   | Karasuno   |
| 音駒     | `nekoma`     | Nekoma     |
| 梟谷     | `fukurodani` | Fukurodani |
| 混合學校 | `mixed`      | Mixed      |

#### 使用方式 (Usage)

##### 1. 獲取學校 CSS Class

```typescript
import { getSchoolClass } from "@/constants/schools";

// 中文名稱 → CSS Class
const cssClass = getSchoolClass("烏野"); // "karasuno"
const cssClass2 = getSchoolClass("青葉城西"); // "seijoh"
const cssClass3 = getSchoolClass("未知學校"); // "karasuno" (default)
```

##### 2. 獲取學校中文名稱

```typescript
import { getSchoolName } from "@/constants/schools";

// CSS Class → 中文名稱
const schoolName = getSchoolName("karasuno"); // "烏野"
const schoolName2 = getSchoolName("seijoh"); // "青葉城西"
```

##### 3. 驗證學校名稱

```typescript
import { isValidSchoolName } from "@/constants/schools";

if (isValidSchoolName("烏野")) {
  // 是有效的學校名稱
}
```

##### 4. 使用映射表

```typescript
import { SCHOOL_CLASS_MAP, SCHOOL_NAME_MAP } from "@/constants/schools";

// 直接訪問映射表
const cssClass = SCHOOL_CLASS_MAP["烏野"]; // "karasuno"
const schoolName = SCHOOL_NAME_MAP["karasuno"]; // "烏野"
```

##### 5. 獲取支援學校列表

```typescript
import {
  SUPPORTED_SCHOOLS,
  SUPPORTED_SCHOOL_CLASSES,
} from "@/constants/schools";

// 所有支援的學校中文名稱
SUPPORTED_SCHOOLS.forEach((school) => {
  console.log(school); // "青葉城西", "烏野"...
});

// 所有支援的 CSS Classes
SUPPORTED_SCHOOL_CLASSES.forEach((className) => {
  console.log(className); // "seijoh", "karasuno"...
});
```

#### TypeScript 類型支援

```typescript
import type { SchoolNameZh, SchoolClass } from "@/constants/schools";

function processSchool(school: SchoolNameZh) {
  // school 只能是 "青葉城西" | "烏野" | "音駒" | "梟谷" | "混合學校"
}

function applyCssClass(className: SchoolClass) {
  // className 只能是 "seijoh" | "karasuno" | "nekoma" | "fukurodani" | "mixed"
}
```

#### 新增學校步驟 (Adding New Schools)

1. 在 `src/constants/schools.ts` 中：

   - 更新 `SchoolNameZh` 類型添加新學校中文名稱
   - 更新 `SchoolClass` 類型添加新 CSS class
   - 在 `SCHOOL_CLASS_MAP` 添加映射
   - 在 `SCHOOL_NAME_MAP` 添加反向映射
   - 更新 `SUPPORTED_SCHOOLS` 列表
   - 更新 `SUPPORTED_SCHOOL_CLASSES` 列表

2. 在 CSS 中添加對應的學校樣式類

3. 完成！所有使用 `getSchoolClass()` 的組件會自動支援新學校

#### 優勢 (Benefits)

- ✅ **單一真實來源**: 所有學校映射集中管理
- ✅ **類型安全**: TypeScript 類型檢查防止拼寫錯誤
- ✅ **易於維護**: 新增學校只需修改一個文件
- ✅ **可重用**: 所有組件共用相同的映射邏輯
- ✅ **文檔完整**: JSDoc 註解提供完整使用說明
