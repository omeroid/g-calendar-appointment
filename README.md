# ミーティング予約枠作成ツール

## 概要

Google Calendar に複数のミーティング予約枠を一括で作成できるWebアプリケーションです。特定の日時に参加者を指定してミーティングを効率的に設定できます。

### 主な特徴

- **一括作成**: 複数の日時にミーティング予約枠を一度に作成
- **参加者指定**: 各ミーティングに参加者を事前に設定
- **柔軟な時間設定**: 30分、1時間、2時間から選択可能
- **簡単な管理**: 作成した予約枠の一覧表示と一括削除
- **共有機能**: 作成した予約枠の一覧をコピーして共有
- **テンプレート機能**: ミーティングのタイトルと説明をテンプレートとして保存・再利用

## 主な機能

### ミーティング設定
- タイトルと説明の入力
- 予約時間の選択（30分/1時間/2時間）
- 場所の設定（Google Meet/電話/対面/カスタム）
- 参加者のメールアドレス指定
- 複数の日時を簡単に選択

### 予約管理
- 設定内容の確認画面
- Googleアカウントでの認証
- 一括での予約枠作成
- 作成された予約枠の一覧表示
- 一覧のコピー機能
- バッチ単位での削除機能

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

3. 必要なAPIを有効化（重要）：
   ```
   APIs & Services > Library で以下のAPIを検索して有効化：
   - Google Calendar API
   - Google People API
   - Google Identity Toolkit API（OAuth認証用）
   ```

4. OAuth 2.0 クライアント ID を作成：
   ```
   APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: Web application
   - Authorized JavaScript origins: 
     - http://localhost:5173 (開発用)
     - http://localhost:5174 (開発用バックアップ)
     - https://[your-username].github.io (本番用)
   - Authorized redirect URIs: 設定不要（暗黙的フロー使用）
   ```

5. API キーを作成：
   ```
   APIs & Services > Credentials > Create Credentials > API key
   - 必要に応じてキーの制限を設定
   - HTTPリファラー制限を推奨
   - 使用するAPIの制限も設定可能
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

### ミーティング予約枠の作成手順

1. **基本情報の入力**
   - ミーティングのタイトルを入力
   - 必要に応じて説明を追加
   - 「テンプレート」ボタンから保存済みのテンプレートを選択可能
   - 「保存」ボタンで現在の入力内容をテンプレートとして保存可能
   - 予約時間をボタンで選択（30分/1時間/2時間）

2. **場所と参加者の設定**
   - 場所を選択（Google Meetは自動でリンク生成）
   - 参加者のメールアドレスを入力（カンマ区切りで複数指定可）

3. **日時の選択**
   - 日付を選択
   - 開始時刻と終了時刻を設定
   - 「日程を追加」で複数の日時を登録

4. **確認と作成**
   - 「確認画面へ」をクリック
   - 設定内容を確認
   - 「予約枠を作成」でGoogleアカウントにログイン
   - 一括でミーティングが作成される

5. **作成後の管理**
   - 作成された予約枠の一覧を確認
   - リンクからGoogleカレンダーの予定にアクセス
   - 一覧をコピーして関係者に共有
   - 必要に応じてバッチ単位で削除

## トラブルシューティング

### よくある問題

1. **「Client ID が無効です」エラー**
   - Google Cloud Console で正しいドメインを承認済みオリジンに追加
   - 環境変数が正しく設定されているか確認

2. **「API キーが無効です」エラー**
   - API キーの制限設定を確認
   - Google Calendar API が有効化されているか確認

3. **「403 Forbidden」エラー**
   - 必要なAPIがすべて有効化されているか確認：
     - Google Calendar API
     - Google People API
     - Google Identity Toolkit API
   - APIキーの制限が厳しすぎないか確認
   - OAuth同意画面が設定されているか確認

4. **ビルドエラー**
   - Node.js のバージョンを確認（20以上）
   - `node_modules` と `.yarn` を削除して `yarn install` を再実行

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。

### テンプレート機能

頻繁に使用するミーティングのタイトルと説明をテンプレートとして保存できます：

1. **テンプレートの保存**
   - タイトルと説明を入力
   - 説明欄の横にある「保存」ボタンをクリック
   - テンプレートがブラウザのローカルストレージに保存される

2. **テンプレートの利用**
   - タイトル欄の横にある「テンプレート」ボタンをクリック
   - 保存済みのテンプレート一覧から選択
   - タイトルと説明が自動的に入力される

3. **テンプレートの削除**
   - テンプレート一覧で各項目の「×」ボタンをクリック
   - 確認後、テンプレートが削除される

## セキュリティに関する注意事項

このアプリケーションを外部に公開する際は、以下のセキュリティ対策を必ず実施してください：

### 1. APIキーの保護

- **本番環境では環境変数を使用**：APIキーやクライアントIDを直接コードに埋め込まない
- **HTTPリファラー制限**：Google Cloud ConsoleでAPIキーに適切な制限を設定
- **APIの制限**：使用するAPIのみに制限（Calendar API、People API等）

### 2. OAuth設定

- **承認済みドメインの制限**：本番環境のドメインのみを承認済みオリジンに追加
- **スコープの最小化**：必要最小限の権限のみをリクエスト
- **トークンの適切な管理**：アクセストークンをローカルストレージに長期保存しない

### 3. データ保護

- **HTTPS必須**：本番環境では必ずHTTPSを使用
- **機密情報の取り扱い**：
  - 参加者のメールアドレスはサーバーに送信・保存しない
  - ミーティングの詳細情報もローカルでのみ処理
  - テンプレート機能で保存されるデータはブラウザのローカルストレージに限定

### 4. アクセス制御

- **CORS設定**：適切なCORSヘッダーを設定
- **CSP（Content Security Policy）**：必要に応じて設定
- **Rate Limiting**：APIの使用制限を設定

### 5. 定期的なセキュリティレビュー

- 依存パッケージの脆弱性チェック：`yarn audit`
- Google Cloud Consoleでの定期的な権限レビュー
- アクセスログの監視

### 6. プライバシー配慮

- ユーザーデータの最小限の収集
- プライバシーポリシーの明示（必要に応じて）
- データ削除機能の提供（テンプレートの削除等）

## ライセンス

[MIT License](LICENSE)