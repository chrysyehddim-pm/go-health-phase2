# 2026-10-20 首頁、位置與健康建議調整

## 情境導覽
18張卡片不增加。S03/S04改為article，兩個獨立入口位於各自卡片內，無巢狀連結。移除外掛的延伸檢查區；七種健康建議狀態切換僅出現在帶adviceCase的導覽頁面。

## 首頁健康圈
三層：圈名+最多五位成員的圓形頭像、最近七天最新兩則動態、本週一項任務建議。無圈時維持建立/加入入口。無近況時提供分享提示。
任務建議固定排序：可領獎、本人完成等家人、團隊解鎖本人未完成、有進度、尚未開始；同順位依結束日期與五種任務原順序。全部領取後顯示完成訊息。圖片使用既有素材的正方形容器，object-fit:contain避免裁切人物，文字放旁邊。可從首頁直接開啟該任務說明或領獎。

## 家人位置
- 自己的頭像是唯一分享設定入口，開啟/關閉後即時更新頭像下方狀態。右上設定移除重複入口。
- 本人：已開啟/未開啟。其他家人：未開啟/近期位置/較早位置/待更新。
- 最近24小時內含24小時為近期；超過24小時至七天含七天為較早；超過七天隱藏地圖與附近搜尋入口。
- 有分享但沒有有效位置資料也為待更新。不將位置未更新推論為未登入，不代替家人開啟授權。
- 地標疊在頭像右下內側，高於頭像圖層；已開啟分享者顯示。
- 未授權頁：不分享位置，也能保持關心。說明由本人決定分享，保留傳送關心。
- 過期頁：傳句關心，邀家人一起回來看看。位置卡標示已開啟位置分享、最後位置已超過七天未更新；不顯示舊地圖。

## 健康建議
移除所有最近七天紀錄卡，改成真實卡片疊層與循環翻牌；可滑動、按左右按鈕或使用左右方向鍵。顯示頁次/分類，不自動播放。只納入有足夠資料可提供建議的指標，不把未授權或不足資料硬做成判讀卡。主要建議仍依心率需確認等既有優先規則排序。
保留更新時間、更新資料與完整紀錄入口。卡片文案整合數據摘要+可做的生活小事；底部以參考日期及有效天數交代依據。卡片無固定截斷高度，維持18px內文。減少動態效果時直接切換卡片順序，不做位移與旋轉動畫。
S04演示七天資料：平均步數3800、睡眠6.2小時、每週中等強度活動90分鐘、兩天靜息心率103/102，其餘日期73–78、體重65公斤持平。四項觸發提醒，體重保持中性建議，不新增異常門檻。示範頁按更新仍保留該情境；一般頁由既有App橋接更新。
未連接時顯示「今天，從一件小事開始」，並說明目前未使用個人健康數據。連接卡按鈕與文字間距20px。移除下方指標列表。

## 新素材
- 路徑：images/illustrations/health-advice.png。
- 製作：內建imagegen，透明背景。
- 最終提示詞：One original isolated illustration asset for GO HEALTH, a warm Taiwanese family wellness app used by older adults. A small open cream wellness journal/notebook with a sage green fabric cover, a simple teal heart symbol and a few unobtrusive non-legible soft lines on its pages, one delicate fresh green leafy sprig next to it, and 2 tiny soft golden glints of light suggesting thoughtful helpful daily advice. Warm hand-painted gouache/watercolor, softly dimensional gentle shadows, charming refined style, honey cream and jade/sage greens, coherent with cozy family health editorial illustrations. Square composition centered, entire notebook and leaves in frame, fills most of image, generous clear silhouette for displaying at 100px on mobile. Genuine transparent background. No people, no feet, no shoes, no exercise equipment, no medical device, no red cross, no text, no letters, no numbers, no logos, no watermark, no frame, no flat vector, no photorealism, no strong plastic gloss.

## 驗證
qa/refinement-oct20.cjs：18張卡片與卡內雙入口、五張建議卡及左右按鈕/鍵盤、七種資料狀態、更新後保持示範資料、無授權按鈕間距、320/390/480px、首頁五人頭像、本人分享開關、家人未授權與七天過期不顯示地圖、24小時/七天邊界、首頁推薦任務直達領獎。修正更新後舊滑動事件的DOM失效問題，最終無頁面JS錯誤。
尚未部署。


## 核可後追加調整：循環疊牌、步行方形圖與家人附近清單
- 首頁健康建議只保留下方按鈕，移除標題右側重複入口。
- 下一張把目前卡移到隊尾，上一張從隊尾取回；頁次依原始分類索引顯示，5/5後回到1/5。動畫包含側移、旋轉、縮放與下一張補位；手勢、按鈕及鍵盤共用同一排序邏輯。不自動播放。
- 非目前卡片設aria-hidden及inert；單張卡不提供無效切換。更新資料重建卡組，過期動畫不再操作新DOM。
- 狀態選單僅在adviceCase導覽參數存在時顯示，預設收合，標題為「導覽專用：切換示範狀態」。
- 首頁任務卡改為左側文字、右側約38%整高插畫。步行使用已核可方形圖images/illustrations/home-task-walk-square.png；其餘四種沿用原圖，後續再製作方形版本。任務優先順序不變。
- S08家人位置仍為示意座標，但附近搜尋與探索使用相同正式Google元件；不帶demoPlaces，舊網址若包含family也不會走固定清單。保留返回位置頁、傳送關心與推薦分享。
- 驗證腳本qa/card-deck-oct20.cjs：循環前後切換、首卡移隊尾、滑動、鍵盤、減少動態、更新、三種寬度、單一首頁入口、核可圖片、實際Google家人附近清單。

### 核可步行素材
內建imagegen依images/scene/task-walk-portrait.webp重新構圖；產出為正方形，保留原人物、服裝與溫暖公園畫風。來源原圖不覆寫。
最終提示詞：Create ONE SQUARE 1:1 homepage task-card illustration for GO HEALTH, adapting the attached existing portrait illustration as the visual reference. Reference role: preserve the same two East Asian family characters, same warm illustrated faces, same painterly anime/storybook rendering, same clothing and same sunlit park walk; recompose for a square thumbnail, do not merely crop the tall image. A cheerful silver-haired older mother in a sage green cardigan and cream blouse, carrying a tan shoulder bag, walking arm in arm with her smiling adult son in an open soft blue shirt, ivory T-shirt and beige trousers. Both look warmly at one another. Make both people LARGE and immediately recognizable at a small mobile card size; frame from just above heads to mid-thigh, with their linked arms clearly visible. Keep both heads, faces and linked arms safely within the central 65 percent width, with clear separation from the background and generous breathing room above their heads. Surround them with softly painted green park trees, a warm golden light canopy, a hint of a garden walking path at the bottom and a few subtle flowers. Maintain the original cream, sage green, soft blue and honey-gold palette and the original stylized facial proportions; no photorealism. Simplify peripheral foliage and background details so the two people remain the focal point. A complete edge-to-edge square illustration, background extends to all four edges for responsive card cropping, no white borders, no collage, no UI, no lettering, no text, no logos, no watermark. This is the first standalone square asset for the existing 双人步行接力 family walking task, not a screenshot or a mockup.

## 前進動畫殘影修正
原因是整張前卡做透明度動畫，同時後卡保留可見文字。改為不透明側移、降到牌堆後再歸位；未上場的後卡只顯示卡背，進場時才顯示文字。返回動畫同樣保持卡片不透明。qa/deck-opaque-review.cjs逐格檢查卡片opacity固定1、後卡文字隱藏、前進/返回循環與動畫中更新資料，無JS錯誤。
