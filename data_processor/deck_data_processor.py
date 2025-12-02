import pandas as pd
import re
import os

def separate_card_id(input_file, output_file):
    """
    處理牌組 CSV 檔案，將「卡片名稱 (編號)」分離為「卡片名稱」和「卡片編號」
    並輸出極簡格式（僅包含卡片名稱、卡片編號、數量三個欄位）
    """
    # 讀取檔案 (嘗試使用 utf-8 或 cp950 編碼以避免亂碼)
    # 跳過前 2 行空白行
    try:
        df = pd.read_csv(input_file, encoding='utf-8', skiprows=2)
    except UnicodeDecodeError:
        df = pd.read_csv(input_file, encoding='cp950', skiprows=2)
    
    # 清理欄位名稱 (移除前後空白)
    df.columns = [c.strip() for c in df.columns]
    
    # 初始化結果列表
    result_data = []
    
    # 遍歷每一行
    for idx, row in df.iterrows():
        # 獲取卡片名稱 (編號) 欄位
        card_name_with_id = str(row.get('卡片名稱 (編號)', '')).strip()
        
        # 如果是空值或包含 "卡片名稱" (第二個標題行)，跳過
        if not card_name_with_id or card_name_with_id == 'nan' or '卡片名稱' in card_name_with_id:
            continue
        
        # 使用正規表達式提取 Name(ID) 格式
        match = re.match(r'^(.+?)\s*\((.+?)\)\s*$', card_name_with_id)
        if match:
            name = match.group(1).strip()
            card_id = match.group(2).strip()
            
            # 獲取數量
            quantity = row.get('數量', 0)
            
            # 確保數量是數字
            try:
                quantity = int(quantity)
            except:
                quantity = 0
            
            # 添加到結果
            result_data.append({
                '卡片名稱 ': name,  # 注意：青葉城西格式中「卡片名稱 」後面有空格
                '卡片編號': card_id,
                '數量': quantity
            })
    
    # 建立新的 DataFrame
    result_df = pd.DataFrame(result_data)
    
    # 確保輸出目錄存在
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 儲存結果
    result_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"處理完成！檔案已儲存為: {output_file}")
    print(f"共處理 {len(result_df)} 張卡片")
    return result_df

if __name__ == "__main__":
    # 測試：處理烏野預組
    input_path = '../public/deck/烏野卡表 - 預組.csv'
    output_path = '../public/deck/烏野/烏野卡表 - 預組.csv'
    
    print(f"開始處理: {input_path}")
    result = separate_card_id(input_path, output_path)
    print("\n處理結果預覽:")
    print(result.head(12))
