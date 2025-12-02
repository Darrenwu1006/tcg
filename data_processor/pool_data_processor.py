import pandas as pd
import os

def clean_and_split_pool_file(input_file, output_dir):
    """
    清理並分拆音駒卡池檔案
    - 移除重複資料
    - 移除空白行
    - 分拆為角色卡和事件卡
    """
    # 讀取檔案
    try:
        df = pd.read_csv(input_file, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(input_file, encoding='cp950')
    
    # 清理欄位名稱
    df.columns = [c.strip() for c in df.columns]
    
    # 移除所有空白行（所有欄位都是空值或NaN的行）
    df = df.dropna(how='all')
    
    # 移除卡片類型為空的行
    df = df[df['卡片類型'].notna()]
    df = df[df['卡片類型'] != '']
    
    # 去除重複的卡片（根據卡片編號和卡片名稱）
    df = df.drop_duplicates(subset=['卡片編號', '卡片名稱', '稀有度'], keep='first')
    
    # 分離角色卡和事件卡
    character_cards = df[df['卡片類型'] == 'CHARACTER'].copy()
    event_cards = df[df['卡片類型'] == 'EVENT'].copy()
    
    # 確保輸出目錄存在
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 儲存角色卡
    character_output = os.path.join(output_dir, '音駒卡表 - 卡池_角色卡.csv')
    character_cards.to_csv(character_output, index=False, encoding='utf-8-sig')
    print(f"角色卡已儲存: {character_output}")
    print(f"共 {len(character_cards)} 張角色卡")
    
    # 儲存事件卡
    event_output = os.path.join(output_dir, '音駒卡表 - 卡池_事件卡.csv')
    event_cards.to_csv(event_output, index=False, encoding='utf-8-sig')
    print(f"事件卡已儲存: {event_output}")
    print(f"共 {len(event_cards)} 張事件卡")
    
    return character_cards, event_cards

if __name__ == "__main__":
    # 處理音駒卡池
    input_path = '../public/pool/梟谷/排球少年Break TCG卡池（共編檔案） - 梟谷.csv'
    output_dir = '../public/pool/梟谷'
    
    print(f"開始處理: {input_path}")
    character_cards, event_cards = clean_and_split_pool_file(input_path, output_dir)
    
    print("\n角色卡預覽:")
    print(character_cards[['卡片編號', '卡片名稱', '稀有度']].head(10))
    
    print("\n事件卡預覽:")
    print(event_cards[['卡片編號', '卡片名稱', '稀有度']].head())
