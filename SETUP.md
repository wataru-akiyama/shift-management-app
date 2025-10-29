# セットアップガイド

このドキュメントでは、シフト管理・出勤退勤管理アプリの初期セットアップ手順を説明します。

## 前提条件

- Node.js 18.0以上
- npm または yarn
- Firebaseアカウント

## 1. リポジトリのクローン

```bash
git clone <repository-url>
cd shift-management-app
```

## 2. 依存パッケージのインストール

```bash
npm install
```

## 3. Firebaseプロジェクトの作成

### 3.1 Firebaseコンソールでプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: shift-management-app）
4. Google Analyticsは任意で有効化
5. プロジェクトを作成

### 3.2 Webアプリを追加

1. プロジェクト概要ページで「ウェブ」アイコンをクリック
2. アプリのニックネームを入力
3. Firebase Hostingも有効化（推奨）
4. アプリを登録
5. Firebase SDK設定をコピー

### 3.3 Authenticationを有効化

1. Firebase Console の左メニューから「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「メール/パスワード」を有効化

### 3.4 Firestoreを有効化

1. Firebase Console の左メニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 本番環境モードで開始（セキュリティルールは後で設定）
4. ロケーションを選択（asia-northeast1推奨）

### 3.5 Firestore セキュリティルールの設定

Firestoreの「ルール」タブで以下のルールを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー認証確認用の関数
    function isAuthenticated() {
      return request.auth != null;
    }

    // 管理者確認用の関数
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // テスター確認用の関数
    function isTester() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'tester';
    }

    // 自分自身のデータか確認
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // ユーザーコレクション
    match /users/{userId} {
      allow read: if isAuthenticated() && (isAdmin() || isOwner(userId));
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(userId);
      allow delete: if isAdmin();
    }

    // 案件コレクション
    match /projects/{projectId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // シフト希望コレクション
    match /shiftRequests/{requestId} {
      allow read: if isAuthenticated() && (isAdmin() || isOwner(resource.data.testerId));
      allow create: if isAuthenticated() && isTester();
      allow update: if isAdmin() || (isTester() && isOwner(resource.data.testerId));
      allow delete: if isAdmin() || (isTester() && isOwner(resource.data.testerId));
    }

    // 確定シフトコレクション
    match /shifts/{shiftId} {
      allow read: if isAuthenticated() && (isAdmin() || isOwner(resource.data.testerId));
      allow write: if isAdmin();
    }

    // 出退勤記録コレクション
    match /attendances/{attendanceId} {
      allow read: if isAuthenticated() && (isAdmin() || isOwner(resource.data.testerId));
      allow write: if isAdmin();
    }

    // システム設定コレクション
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

## 4. 環境変数の設定

`.env.local`ファイルを開き、Firebase SDKの設定値を入力：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 5. 初期データの投入（オプション）

Firestore Console から手動で初期管理者ユーザーを作成：

1. Firebase Console の「Authentication」で新規ユーザーを追加
2. 「Firestore Database」で`users`コレクションに以下のドキュメントを追加：

```json
{
  "id": "<AuthenticationのUID>",
  "name": "管理者",
  "email": "admin@example.com",
  "phone": "090-1234-5678",
  "role": "admin",
  "status": "active",
  "createdAt": <現在のタイムスタンプ>,
  "updatedAt": <現在のタイムスタンプ>
}
```

3. `settings`コレクションに初期設定を追加：

```json
{
  "id": "default",
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "updatedAt": <現在のタイムスタンプ>
}
```

## 6. PWAアイコンの準備

`public/icons/`ディレクトリにアプリアイコンを配置します。

必要なサイズ：
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

アイコン生成ツール：
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 8. ビルドとデプロイ

### ローカルビルド

```bash
npm run build
npm start
```

### Firebase Hostingへのデプロイ

```bash
# Firebase CLIをインストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebase初期化
firebase init hosting

# デプロイ
npm run build
firebase deploy
```

## トラブルシューティング

### Firebase接続エラー

- `.env.local`の設定値が正しいか確認
- Firebaseプロジェクトのステータスを確認

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
```

### PWAが動作しない

- HTTPSで動作しているか確認（開発時はlocalhostでOK）
- Service Workerの登録状況を確認（DevTools > Application）

## 次のステップ

セットアップが完了したら、以下の機能から実装を開始してください：

1. 認証機能（ログイン・ログアウト）
2. ダッシュボード
3. テスター管理
4. 案件管理
5. シフト管理
6. 出退勤管理
7. 給与計算

詳細は`README.md`を参照してください。
