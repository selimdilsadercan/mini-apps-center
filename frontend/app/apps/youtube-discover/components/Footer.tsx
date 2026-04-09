import Link from "next/link";
import { Flame, Github, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-black/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                dizi<span className="text-red-500">.tube</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-400">
              YouTube dünyasının en iyi serilerini keşfetmeniz, takip etmeniz ve puanlamanız için tasarlanmış bağımsız bir platform.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-zinc-500 transition-colors hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 transition-colors hover:text-white">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 transition-colors hover:text-white">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Bağlantılar</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/" className="hover:text-white">Ana Sayfa</Link>
              </li>
              <li>
                <Link href="/kesfet" className="hover:text-white">Keşfet</Link>
              </li>
              <li>
                <Link href="/listem" className="hover:text-white">Listem</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Yasal</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#" className="hover:text-white">Kullanım Koşulları</a>
              </li>
              <li>
                <a href="#" className="hover:text-white">Gizlilik Politikası</a>
              </li>
              <li>
                <a href="#" className="hover:text-white">Telif Hakkı</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} dizi.tube. Tüm hakları saklıdır. Bu site YouTube ile resmi olarak bağlantılı değildir.</p>
        </div>
      </div>
    </footer>
  );
}
