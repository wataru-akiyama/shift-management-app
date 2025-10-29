export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            シフト管理アプリ
          </h1>
          <p className="text-gray-600">
            出勤退勤管理・給与計算システム
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            プロジェクトセットアップが完了しました
          </p>
        </div>
      </div>
    </div>
  );
}
