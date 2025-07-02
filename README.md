# Google Calendar 予約スケジュール代理作成ツール

## 概要

Google Calendar の予約スケジュール機能を、他の人が代理で設定できるようにするWebアプリケーションです。

### 背景と課題

Google Calendar の予約スケジュール機能は便利ですが、以下のような課題があります：

- **個人設定の制限**: 予約スケジュールは各個人が自分で設定する必要がある
- **代理設定の不可**: 秘書や管理者が他の人の予約スケジュールを代理で設定することができない
- **一括管理の困難**: 組織内で統一された予約受付を設定する際に、各人が個別に設定する必要がある

### ソリューション

このツールは以下の方法で上記の課題を解決します：

1. **管理者モード**: 予約スケジュールの設定内容を事前に定義し、共有可能なリンクを生成
2. **実行モード**: 本人が共有リンクにアクセスし、ワンクリックで自分のGoogleカレンダーに予約スケジュールを作成

## 主な機能

### 管理者向け機能
- 予約スケジュールの詳細設定（タイトル、説明、時間、場所など）
- 利用可能な曜日と時間帯の設定
- バッファタイムの設定
- 予約可能期間の設定
- 設定内容のプレビュー
- 共有リンクの生成とコピー

### 利用者向け機能
- 共有リンクから設定内容の確認
- Googleアカウントでの認証
- ワンクリックでの予約スケジュール作成

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript
- **ビルドツール**: Vite
- **API**: Google Calendar API
- **デプロイ**: GitHub Pages (GitHub Actions)

## 開発環境のセットアップ

### 前提条件

- Node.js 20以上
- Yarn 1.22以上
- Google Cloud Console アカウント

### Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス

2. 新しいプロジェクトを作成または既存のプロジェクトを選択

3. Google Calendar API を有効化：
   ```
   APIs & Services > Library > "Google Calendar API" を検索 > 有効化
   ```

4. OAuth 2.0 クライアント ID を作成：
   ```
   APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: Web application
   - Authorized JavaScript origins: 
     - http://localhost:5173 (開発用)
     - https://[your-username].github.io (本番用)
   - Authorized redirect URIs: 同上
   ```

5. API キーを作成：
   ```
   APIs & Services > Credentials > Create Credentials > API key
   - 必要に応じてキーの制限を設定
   ```

### ローカル開発環境の構築

1. リポジトリをクローン：
   ```bash
   git clone https://github.com/[your-username]/g-calendar-proxy-reservation.git
   cd g-calendar-proxy-reservation
   ```

2. 環境変数を設定：
   ```bash
   cp .env.example .env
   ```
   
   `.env` ファイルを編集して、Google Cloud Console で取得した認証情報を設定：
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-api-key
   ```

3. 依存関係をインストール：
   ```bash
   yarn install
   ```

4. 開発サーバーを起動：
   ```bash
   yarn dev
   ```
   
   ブラウザで http://localhost:5173 にアクセス

## ビルドとデプロイ

### ローカルビルド

```bash
# プロダクションビルド
yarn build

# ビルド結果のプレビュー
yarn preview
```

ビルド成果物は `dist/` ディレクトリに生成されます。

### GitHub Pages へのデプロイ

#### 自動デプロイの設定

1. GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定：
   - `VITE_GOOGLE_CLIENT_ID`: Google OAuth クライアント ID
   - `VITE_GOOGLE_API_KEY`: Google API キー

2. Settings > Pages で：
   - Source: Deploy from a branch → GitHub Actions に変更
   - 設定を保存

3. main ブランチにプッシュすると自動的にデプロイ：
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

#### 手動デプロイ

GitHub Actions の workflow_dispatch を使用して手動でデプロイすることも可能です：
1. Actions タブに移動
2. "Deploy to GitHub Pages" ワークフローを選択
3. "Run workflow" をクリック

## 使い方

### 管理者（代理人）の操作

1. 「管理者モード（代理人用）」タブを選択
2. 予約スケジュールの詳細を入力：
   - タイトル: 予約スケジュールの名前
   - 説明: 予約の詳細説明（任意）
   - 予約時間: 1回の予約の長さ
   - 場所: Google Meet、電話、対面、カスタム
   - バッファタイム: 予約間の休憩時間
   - 利用可能な曜日と時間帯
   - 予約可能期間: 何日先まで予約可能か
3. 「共有リンクを生成」をクリック
4. 生成されたリンクをコピーして利用者に共有

### 利用者（本人）の操作

1. 管理者から共有されたリンクにアクセス
2. 「実行モード（本人用）」タブが自動的に表示される
3. 設定内容を確認
4. 「Googleアカウントでログインして作成」をクリック
5. Googleアカウントでログイン
6. 権限を許可
7. 予約スケジュールが自動的に作成される

## トラブルシューティング

### よくある問題

1. **「Client ID が無効です」エラー**
   - Google Cloud Console で正しいドメインを承認済みオリジンに追加
   - 環境変数が正しく設定されているか確認

2. **「API キーが無効です」エラー**
   - API キーの制限設定を確認
   - Google Calendar API が有効化されているか確認

3. **ビルドエラー**
   - Node.js のバージョンを確認（20以上）
   - `node_modules` と `.yarn` を削除して `yarn install` を再実行

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。

## ライセンス

[MIT License](LICENSE)