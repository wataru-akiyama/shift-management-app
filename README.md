# シフト管理・出勤退勤管理アプリ

町民向けアプリテストの仕事を依頼する際の、シフト管理・出退勤記録・給与計算を一元管理するシステムです。

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase** (Authentication, Firestore, Hosting)
- **PWA対応**

## 主な機能

- 認証機能（管理者・テスター）
- 案件管理
- シフト管理（希望提出・承認・確定）
- 出退勤管理（QRコード打刻）
- 給与計算
- テスター管理
- ダッシュボード

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、Firebase設定を追加：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 4. ビルド

```bash
npm run build
```

### 5. 本番環境起動

```bash
npm start
```

## プロジェクト構造

```
shift-management-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (admin)/           # 管理者向けページ
│   ├── (tester)/          # テスター向けページ
│   ├── api/               # API Routes
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ
│   └── globals.css        # グローバルスタイル
├── components/            # 再利用可能なコンポーネント
├── lib/                   # ユーティリティ・ヘルパー関数
│   ├── firebase/          # Firebase設定・関数
│   └── utils/             # 各種ユーティリティ
├── types/                 # TypeScript型定義
├── public/                # 静的ファイル
│   ├── manifest.json      # PWA manifest
│   └── icons/             # アプリアイコン
├── next.config.js         # Next.js設定
├── tailwind.config.ts     # Tailwind CSS設定
└── tsconfig.json          # TypeScript設定
```

## ライセンス

Private
