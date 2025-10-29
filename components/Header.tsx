'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-primary-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            シフト管理アプリ
          </Link>
          <nav className="flex gap-4">
            {/* ログイン後にナビゲーションを表示 */}
          </nav>
        </div>
      </div>
    </header>
  );
}
