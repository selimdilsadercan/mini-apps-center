"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ScrollText, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF9F7] py-12 px-6 flex justify-center items-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Ana Sayfaya Dön</span>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 border-b border-gray-100 pb-8">
          <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-4">
            <ScrollText size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Kullanım Koşulları</h1>
          <p className="text-gray-500 text-sm">Son Güncelleme: 20 Haziran 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
              1. Koşulların Kabulü
            </h2>
            <p>
              Everything Mini Apps Center'a ("Hizmet") erişerek veya Hizmet'i kullanarak, bu Kullanım Koşulları'nı ("Koşullar") okuduğunuzu, anladığınızı ve bunlara bağlı kalmayı kabul ettiğinizi beyan edersiniz. Eğer bu koşulları kabul etmiyorsanız, lütfen Hizmet'i kullanmayınız.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
              2. Hizmet Kullanımı ve Hesap Güvenliği
            </h2>
            <p>
              Hizmet'i kullanabilmek için Google OAuth veya sunulan diğer yöntemlerle kimlik doğrulama yapmanız gerekebilir. Hesabınızın güvenliğini ve şifrenizin gizliliğini korumak sizin sorumluluğunuzdadır. Hesabınız altında gerçekleşen tüm faaliyetlerden tamamen siz sorumlu olursunuz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
              3. Fikri Mülkiyet Hakları
            </h2>
            <p>
              Everything Mini Apps Center ve içinde barındırılan tüm mini uygulamaların tasarımı, kodları, logoları, grafikleri ve markaları Everything ekibine aittir ve uluslararası fikri mülkiyet yasalarıyla korunmaktadır. Yazılı izin olmaksızın kopyalanamaz, çoğaltılamaz veya dağıtılamaz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
              4. Kabul Edilebilir Kullanım
            </h2>
            <p>
              Kullanıcılar, Hizmet'i yalnızca yasal amaçlar doğrultusunda kullanmayı kabul ederler. Platformu kötüye kullanmak, sunuculara veya veritabanına zarar verecek saldırılarda bulunmak, diğer kullanıcıların deneyimini olumsuz etkileyecek faaliyetler yürütmek kesinlikle yasaktır.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
              5. Sorumluluk Reddi
            </h2>
            <p>
              Everything Mini Apps Center, hizmetleri "olduğu gibi" ve "kullanılabilir olduğu sürece" sunmaktadır. Hizmetin kesintisiz, hatasız veya tamamen güvenli olacağını garanti etmeyiz. Doğrudan veya dolaylı olarak ortaya çıkabilecek veri kayıplarından Everything sorumlu tutulamaz.
            </p>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF6B35] rounded-full inline-block" />
              İletişim
            </h2>
            <p>
              Kullanım koşulları hakkında herhangi bir sorunuz olması durumunda bizimle iletişime geçebilirsiniz:
            </p>
            <p className="font-semibold text-indigo-600">
              <a href="mailto:contact@allminiapps.com" className="hover:underline">
                contact@allminiapps.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} Everything Mini Apps Center. Tüm Hakları Saklıdır.
        </div>
      </div>
    </div>
  );
}
