"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Scroll } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <div className="w-16 h-16 bg-[#FF6B35]/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-[#FF6B35]" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Gizlilik Politikası</h1>
          <p className="text-gray-500 text-sm">Son Güncelleme: 20 Haziran 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF6B35] rounded-full inline-block" />
              1. Giriş
            </h2>
            <p>
              Everything Mini Apps Center ("Uygulama"), kullanıcılarımızın gizliliğine son derece önem vermektedir. Bu Gizlilik Politikası, uygulamamızı ve sunduğumuz hizmetleri kullanırken hangi bilgilerinizin toplandığını, nasıl kullanıldığını ve nasıl korunduğunu açıklar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF6B35] rounded-full inline-block" />
              2. Toplanan Veriler
            </h2>
            <p>
              Google OAuth veya diğer yöntemlerle giriş yaptığınızda, yalnızca kimlik doğrulama ve hesabınızı güvenli bir şekilde yönetmek amacıyla temel profil bilgileriniz alınır:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Adınız ve Soyadınız</li>
              <li>E-posta Adresiniz</li>
              <li>Profil Fotoğrafınız (isteğe bağlı)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF6B35] rounded-full inline-block" />
              3. Verilerin Kullanım Amacı
            </h2>
            <p>
              Toplanan veriler aşağıdaki amaçlarla sınırlı olarak kullanılır:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Uygulamaya güvenli bir şekilde giriş yapmanızı sağlamak</li>
              <li>Mini uygulamalardaki kişiselleştirilmiş verilerinizi (kiler, bütçe vb.) hesabınızla eşleştirmek</li>
              <li>Kullanıcı deneyimini iyileştirmek ve teknik sorunları çözmek</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF6B35] rounded-full inline-block" />
              4. Veri Güvenliği ve Paylaşımı
            </h2>
            <p>
              Kullanıcı verileriniz hiçbir şekilde üçüncü taraflara satılmaz, kiralanmaz veya ticari amaçlarla paylaşılmaz. Verileriniz endüstri standardı güvenlik önlemleri ve güvenli altyapılar (Clerk ve Supabase) kullanılarak korunmaktadır.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF6B35] rounded-full inline-block" />
              5. Kullanıcı Hakları
            </h2>
            <p>
              Dilediğiniz zaman profil ayarlarınızdan hesabınızı ve hesabınızla ilişkili tüm verileri kalıcı olarak silme hakkına sahipsiniz. Sorularınız veya veri silme talepleriniz için bizimle iletişime geçebilirsiniz.
            </p>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
              İletişim
            </h2>
            <p>
              Gizlilik politikamız hakkında sorularınız için bize şu adresten ulaşabilirsiniz:
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
