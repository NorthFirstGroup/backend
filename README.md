<!-- @format -->

# Node.js + TypeScript + TypeORM 開發環境

```text
> 主結構
    src/
    ├── config/ # 系統設定， 從 index.ts ConfigManager 取設定值
    ├── controllers/ # API 實作區
    ├── db/ # 資料庫相關
    |   ├── data-source.ts # Postgres 資料庫連線
    |   └── redis-source.ts # Redis 資料庫連線
    ├── entities/ # 資料庫實體
    ├── middlewares/ # 中介層 (認證)
    ├── migrations/ # 系統種子資料
    ├── routes/ # 路由
    ├── utils/ # 通用功能
    ├── app.ts # Express 應用程式入口，新路由要加到這
    └── server.ts # 啟動伺服器

```

## 開啟專案

1. 打開專案前往專案根目錄
2. 開啟該專案根目錄

```shell
npm install
npm run build
```
3. 啟動前確認.env，要執行 dev 就把 DB_HOST 及 REDIS_HOST 調成 localhost
```shell
npm run startdocker
npm run dev
```
## Commit 規範

Commit 訊息依照 [約定式提交 (Conventional Commits)](https://www.conventionalcommits.org/zh-hant/v1.0.0/)。

### Type

-   build: 影響構建系統或外部依賴項的更改。
-   chore: 其他，並且也不會修改原始碼或是測試。
-   ci: 更改我們的 CI 配置文件和腳本。
-   docs: 文檔的修改。
-   feat: 功能新增修改。
-   fix: 修復 Bug。
-   perf: 提升效能的改進。
-   refactor: 重構現有程式碼，不屬於新增新功能或是修 bug。
-   revert: 回復前一個提交的 commit。
-   style: 不影響功能的更改（空格、格式、缺少分號等）。
-   test: 測試。
-   release: 發版
