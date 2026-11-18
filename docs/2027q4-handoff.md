# GO HEALTH 交付與驗收

## 從這裡開始

以靜態伺服器開啟 ZIP 裡的目錄，例如執行 `python -m http.server 4175`，再於瀏覽器開啟 `http://127.0.0.1:4175/demo.html`。

- **2027 Q4 首發驗收**：從情境導覽的「開始首發體驗」進入。五大頁沿用同一首發設定。入口可直接使用 `index.html?release=launch`。
- **完整功能參考**：從同一頁的原有情境或吳小花完整旅程進入。完整首頁也可透過 `index.html?release=full` 開啟。
- 一般公告、全站維護、服務錯誤的預覽在首發驗收區。首發與完整展示分開保存操作資料。

## 首發功能與串接

| 功能 | 首發預設 | 正式驗收 |
| --- | --- | --- |
| 健康指標、家人位置與附近去處 | 尚未開放 | 點標籤或直接開深層網址均不得呼叫健康資料、定位權限或地圖。 |
| 首頁 | 健康小提醒與心情／動腦紀錄 | 提醒取自現有一般文案池，每個台北日顯示一則。 |
| 健康圈 | 文字、心情、文章分享、社交互動與手動關心 | 健康紀錄與地點分享入口延後。 |
| 心情日記共同任務 | 首發驗收候選 | 驗證日記、成員達標、領點與查累點。 |
| 動腦共同任務 | `brainTeamTask: false` | Peter 確認遊戲完成回傳與給點後開啟。 |
| 個人賺點 | `personalRewards: false` | 按各任務的完成與入點能力確認。半年度問卷仍需正式網址及完成回傳。如果首發只開部分個人任務，請以正式可上架清單篩選。 |
| 點數兌換 | `pointsExchange: false` | 確認 HAPPY GO 兌換及帳務後開啟。 |
| 自動關心 | `automaticCare: false` | 確認登入、遊玩事件及同意設定後開啟。首發只適用登入與遊玩條件。 |

正式版在 `assets/p2-release-config.js` 設 `environment: 'production'`，保留 `productionMode: 'launch'`，此時網址參數不會切換模式。首發畫面及此設定供開發參考，正式上線須用工程團隊的會員、授權、點數和服務端能力取代 Prototype 模擬，並在伺服器同步限制尚未開放的能力。展示入口及測試資料應從會員部署入口分開。

## 公告與錯誤

- 一般公告由 Peter 填寫同一設定檔的 `announcement.title`、`announcement.body`，並切換 `announcement.enabled`，首頁會顯示入口。
- 全站維護填寫 `maintenance.title`、`body`、`period` 和 `enabled`。時間欄可留空，生效與恢復由部署設定控制。
- 全頁失敗由服務端或 HAPPY GO 容器導向 `service.html?state=error&return=explore.html`。重試僅接受本工具列出的站內頁面。全頁根本載不出來時，容器或服務端須提供自己的錯誤處理。
- 單一功能失敗沿用原區塊的錯誤和重試入口。內部錯誤分類由服務端記錄。
- `happyGoReturnUrl` 留給 Peter 接正式 HAPPY GO 返回方式。展示版先返回情境導覽。正式條款與各外部入口由權責單位審閱、實機驗收。

本包的地圖展示金鑰已移除。需測試完整地圖時，使用專案核准的設定重新填入 `assets/maps-config.js`。
