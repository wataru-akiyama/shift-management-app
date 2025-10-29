# 開発ガイド

## プロジェクト構造

```
shift-management-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認証関連ページ（ログイン等）
│   │   └── login/
│   ├── (admin)/             # 管理者向けページ
│   │   ├── dashboard/
│   │   ├── projects/        # 案件管理
│   │   ├── shifts/          # シフト管理
│   │   ├── attendance/      # 出退勤管理
│   │   ├── wages/           # 給与管理
│   │   ├── testers/         # テスター管理
│   │   └── settings/        # システム設定
│   ├── (tester)/            # テスター向けページ
│   │   ├── dashboard/
│   │   ├── shifts/          # シフト希望・確認
│   │   ├── qr-code/         # QRコード表示
│   │   ├── attendance/      # 出退勤履歴
│   │   └── wages/           # 給与確認
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   ├── shifts/
│   │   └── attendance/
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # トップページ
│   └── globals.css          # グローバルスタイル
├── components/              # 再利用可能なコンポーネント
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Loading.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   └── index.ts
├── lib/                     # ユーティリティ・ヘルパー
│   ├── firebase/
│   │   ├── config.ts       # Firebase設定
│   │   └── auth.ts         # 認証関連関数
│   └── utils/
│       ├── timeCalculations.ts  # 時間計算
│       └── index.ts
├── types/                   # TypeScript型定義
│   └── index.ts
├── public/                  # 静的ファイル
│   ├── manifest.json        # PWA manifest
│   └── icons/               # アプリアイコン
├── .env.local               # 環境変数（gitignore対象）
├── .env.example             # 環境変数サンプル
├── next.config.js           # Next.js設定
├── tailwind.config.ts       # Tailwind CSS設定
├── tsconfig.json            # TypeScript設定
├── package.json
├── README.md
├── SETUP.md                 # セットアップガイド
└── DEVELOPMENT.md           # 開発ガイド（このファイル）
```

## 開発フロー

### Phase 1: 認証機能（優先度：高）

1. **ログイン画面**
   - `app/(auth)/login/page.tsx`
   - メールアドレス・パスワード入力
   - Firebase Authenticationで認証
   - 役割に応じたリダイレクト

2. **認証コンテキスト**
   - `lib/contexts/AuthContext.tsx`
   - ログイン状態の管理
   - ユーザー情報の保持

3. **認証ガード**
   - `lib/hooks/useAuth.ts`
   - 未認証時のリダイレクト
   - 役割ベースのアクセス制御

### Phase 2: ダッシュボード（優先度：高）

1. **管理者ダッシュボード**
   - `app/(admin)/dashboard/page.tsx`
   - 今日のシフト一覧
   - 出勤状況
   - 未承認のシフト希望件数

2. **テスターダッシュボード**
   - `app/(tester)/dashboard/page.tsx`
   - 今日のシフト
   - 今週のシフト一覧

### Phase 3: テスター管理（優先度：高）

1. **テスター一覧**
   - `app/(admin)/testers/page.tsx`
   - テスターのリスト表示
   - ステータス管理

2. **テスター登録**
   - `app/(admin)/testers/new/page.tsx`
   - 招待メール送信

3. **テスター編集**
   - `app/(admin)/testers/[id]/edit/page.tsx`

### Phase 4: 案件管理（優先度：高）

1. **案件一覧**
   - `app/(admin)/projects/page.tsx`

2. **案件登録・編集**
   - `app/(admin)/projects/new/page.tsx`
   - `app/(admin)/projects/[id]/edit/page.tsx`

### Phase 5: シフト管理（優先度：高）

1. **シフト希望提出（テスター側）**
   - `app/(tester)/shifts/request/page.tsx`
   - 日付・時間選択
   - 希望の編集・取消

2. **シフト希望一覧（管理者側）**
   - `app/(admin)/shifts/requests/page.tsx`
   - 希望の承認・却下

3. **シフトカレンダー**
   - `app/(admin)/shifts/calendar/page.tsx`
   - 月/週/日表示切替
   - 案件別集計表示

4. **シフト確認（テスター側）**
   - `app/(tester)/shifts/page.tsx`
   - カレンダー形式

### Phase 6: 出退勤管理（優先度：高）

1. **QRコード表示（テスター側）**
   - `app/(tester)/qr-code/page.tsx`
   - 個人用QRコード常時表示

2. **QRコード読み取り（iPad）**
   - `app/clock/page.tsx`
   - カメラでQRコード読み取り
   - 出勤・退勤ボタン

3. **打刻記録一覧（管理者側）**
   - `app/(admin)/attendance/page.tsx`
   - テスター別/日別表示
   - 手動記録・修正

4. **出退勤履歴（テスター側）**
   - `app/(tester)/attendance/page.tsx`
   - カレンダー + リスト形式

### Phase 7: 給与計算（優先度：中）

1. **個人別給与確認（管理者側）**
   - `app/(admin)/wages/[testerId]/page.tsx`
   - 月別集計・案件別集計・日別詳細

2. **案件別給与確認（管理者側）**
   - `app/(admin)/wages/projects/[projectId]/page.tsx`

3. **月次レポート（管理者側）**
   - `app/(admin)/wages/reports/page.tsx`

4. **自分の給与確認（テスター側）**
   - `app/(tester)/wages/page.tsx`

### Phase 8: システム設定（優先度：中）

1. **マスタ設定**
   - `app/(admin)/settings/page.tsx`
   - 休憩時間設定

### Phase 9: 最適化（優先度：低）

1. **PWA最適化**
   - Service Workerの改善
   - オフライン対応

2. **パフォーマンス改善**
   - コード分割
   - 画像最適化

## コーディング規約

### TypeScript

- `strict`モード有効
- 明示的な型定義を推奨
- `any`型の使用を避ける

### React/Next.js

- 関数コンポーネントを使用
- Server ComponentとClient Componentを適切に使い分け
- `'use client'`ディレクティブを必要な場合のみ使用

### スタイリング

- Tailwind CSSユーティリティクラスを使用
- カスタムCSSは最小限に
- レスポンシブデザインを考慮

### 命名規則

- コンポーネント: PascalCase（例: `UserProfile.tsx`）
- 関数: camelCase（例: `calculateWage`）
- 定数: UPPER_SNAKE_CASE（例: `MAX_SHIFT_HOURS`）
- 型: PascalCase（例: `User`, `ShiftRequest`）

## Git運用

### ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `bugfix/*`: バグ修正

### コミットメッセージ

```
<type>: <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: ビルド・設定

**例:**
```
feat: ログイン機能を実装

Firebase Authenticationを使用したメール/パスワード認証を実装。
管理者とテスターで異なるダッシュボードにリダイレクト。
```

## テスト

### 単体テスト

```bash
# Jest + React Testing Library（今後導入予定）
npm test
```

### E2Eテスト

```bash
# Playwright（今後導入予定）
npm run test:e2e
```

## デバッグ

### Firebase Emulator（ローカル開発）

```bash
firebase emulators:start
```

### ログ

```typescript
// 開発環境でのみログ出力
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}
```

## パフォーマンス

### 最適化Tips

1. **画像最適化**
   - Next.jsの`Image`コンポーネントを使用
   - WebP形式を優先

2. **コード分割**
   - Dynamic Importを活用
   - Route-based splitting

3. **キャッシング**
   - SWRやReact Queryを活用（今後導入予定）

4. **バンドルサイズ削減**
   - Tree shakingを意識
   - 不要な依存関係を削除

## セキュリティ

### ベストプラクティス

1. **環境変数**
   - `.env.local`をgitignoreに追加済み
   - 公開リポジトリに秘密情報を含めない

2. **Firestore Security Rules**
   - 役割ベースのアクセス制御を実装
   - 定期的にルールをレビュー

3. **XSS対策**
   - ユーザー入力のサニタイズ
   - DOMPurifyの使用（必要に応じて）

4. **CSRF対策**
   - Next.jsのAPI Routesを使用

## リリース

### プロダクションビルド

```bash
npm run build
```

### Firebase Hostingへデプロイ

```bash
firebase deploy
```

### デプロイ前チェックリスト

- [ ] 環境変数の確認
- [ ] Firestore Security Rulesの確認
- [ ] エラーハンドリングの実装
- [ ] レスポンシブデザインの確認
- [ ] PWA動作確認
- [ ] パフォーマンステスト

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## トラブルシューティング

問題が発生した場合は、以下を確認してください：

1. `SETUP.md`の手順を全て完了しているか
2. Firebase設定が正しいか
3. 依存関係が最新か（`npm install`を実行）
4. キャッシュをクリア（`.next`フォルダを削除）
