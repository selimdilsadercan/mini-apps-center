"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { 
  RocketLaunch, 
  Handshake, 
  Clock, 
  QrCode, 
  DeviceMobile, 
  Megaphone, 
  Users,
  CheckCircle,
  Lightning,
  Storefront,
  ChatTeardropDots,
  Cards,
  Star,
  ArrowRight,
  ShieldCheck,
  TrendUp,
  Monitor
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAppRootUrl } from "@/lib/apps";

export default function ForBusinessesPage() {
  const notJustQRFeatures = [
    {
      icon: <QrCode size={32} weight="duotone" className="text-emerald-600" />,
      title: "Dijital Menü",
      description: "Müşteriler menünüze QR ile veya işletme linkinizden ulaşabilir. Fiyatlara ve ürünlere mekana gelmeden önce de bakabilir."
    },
    {
      icon: <Monitor size={32} weight="duotone" className="text-blue-600" />,
      title: "Dijital Vitrin",
      description: "Instagram bio’ya, Google profilinize veya masadaki QR’a koyabileceğiniz tek bir dijital vitrin."
    },
    {
      icon: <Megaphone size={32} weight="duotone" className="text-amber-500" />,
      title: "Uygulama İçi Kampanyalar",
      description: "Günlük fırsatlar, öğrenci indirimleri, happy hour ve özel kampanyalarınızı müşterilere gösterebilirsiniz."
    },
    {
      icon: <TrendUp size={32} weight="duotone" className="text-indigo-600" />,
      title: "Öne Çıkarma Alanları",
      description: "İşletmenizi Everything ekosistemi içinde ilgili modüllerde öne çıkarma fırsatları."
    },
    {
      icon: <Cards size={32} weight="duotone" className="text-rose-600" />,
      title: "Müdavim Kartı",
      description: "“8 kahve al, 1 kahve bizden” gibi kampanyaları dijital hale getirin. Müşteri kart kaybetmeden damga toplasın."
    },
    {
      icon: <ChatTeardropDots size={32} weight="duotone" className="text-purple-600" />,
      title: "Feedback",
      description: "Müşterileriniz hızlıca puan ve yorum bırakabilir. Geri bildirimleri tek yerden takip edebilirsiniz."
    }
  ];

  const pricingPlans = [
    {
      name: "Founder Plan",
      price: "₺740",
      period: "/ ay",
      description: "İlk işletmelere özel düşük fiyat ve düzenli destek.",
      features: [
        "Dijital vitrin",
        "Dijital menü",
        "Müdavim kartı",
        "Kampanya alanı",
        "Feedback alanı",
        "QR kod",
        "1 Ay Ücretsiz Deneme",
        "İlk kurulum desteği",
        "Öncelikli teknik destek",
        "İşletme analitiği"
      ],
      cta: "Hemen Başla",
      highlight: true
    },
    {
      name: "Pro Plan",
      price: "Yakında",
      period: "",
      description: "Daha gelişmiş kampanya ve öne çıkarma modülleri.",
      features: [
        "Gelişmiş kampanya yönetimi",
        "Gelişmiş öne çıkarma",
        "Detaylı istatistikler",
        "Ekstra işletme modülleri"
      ],
      cta: "Haber Ver",
      highlight: false,
      disabled: true
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#FAF9F7] text-gray-900 overflow-x-hidden antialiased">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* 1. Hero Section */}
        <section className="max-w-6xl mx-auto px-6 mb-24">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest"
            >
              <Storefront size={16} weight="fill" />
              Everything for Local Businesses
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-[1000] tracking-tight leading-[1.05] max-w-4xl mx-auto"
            >
              Sadece QR menü değil, <span className="text-indigo-600 text-glow-indigo">işletmenizin dijital vitrini.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-bold leading-relaxed"
            >
              Menünüzü, kampanyalarınızı, sadakat kartınızı ve müşteri geri bildirimlerinizi tek linkte toplayın. Everything ile işletmenizin dijital yüzünü 1 günde kurun.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4 pt-4"
            >
              <Link
                href={getAppRootUrl()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-sm transition-all shadow-2xl shadow-indigo-500/20 active:scale-95"
              >
                1 Ay Ücretsiz Deneyin
              </Link>
              <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-10 py-5 rounded-2xl font-black text-sm transition-all active:scale-95">
                Demo Gör
              </button>
            </motion.div>
          </div>
        </section>

        {/* 2. Problem & Solution Section */}
        <section className="bg-white py-24 mb-32 border-y border-gray-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl md:text-5xl font-[1000] leading-tight text-gray-900">
                  Müşteriler artık işletmenizi sadece içeride değil, <span className="text-indigo-600">dijitalde de</span> görmek istiyor.
                </h2>
                <p className="text-lg text-gray-500 font-bold leading-relaxed">
                  Klasik QR menüler yalnızca menüyü gösterir. Ama müşteriniz menüden fazlasını arar: fiyatlara önceden bakmak, kampanyaları görmek, işletmenizi tanımak, sadakat kartını kullanmak ve hızlıca geri bildirim bırakmak ister.
                </p>
                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                  <p className="font-black text-indigo-900 leading-relaxed">
                    Everything, işletmenizi sadece dijital menüye değil, daha kullanışlı bir dijital vitrine dönüştürür.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                {/* Image Placeholder */}
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative z-10 bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-indigo-500/20 transform lg:rotate-3 hover:rotate-0 transition-transform duration-500 max-w-[320px] mx-auto"
                >
                  <div className="aspect-[9/19] bg-indigo-950 rounded-[2.5rem] overflow-hidden flex items-center justify-center border border-white/10 relative group">
                    {/* Bu alana görsel gelecek */}
                    <div className="text-center p-8">
                      <DeviceMobile size={64} weight="duotone" className="text-indigo-400/20 mx-auto mb-4" />
                      <p className="text-indigo-300/30 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                        Dijital Vitrin<br/>Görseli Buraya Gelecek
                      </p>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
                  </div>
                </motion.div>
                
                {/* Background decorative circles */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-50" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. “Sadece QR Menü Değil” Section */}
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-[1000] tracking-tight text-gray-900">Sadece QR menü değil.</h2>
            <p className="text-gray-500 text-lg font-bold">Everything, işletmeniz için küçük ama etkili dijital araçları tek sayfada birleştirir.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dijital Menü */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="mb-8 h-40 bg-emerald-50 rounded-[2rem] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bg-white p-3 rounded-2xl shadow-lg w-full transform -rotate-2 group-hover:rotate-0 transition-transform">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                      <div className="h-2 bg-gray-50 rounded-full w-1/2" />
                    </div>
                    <div className="text-emerald-600 font-black text-xs">₺140</div>
                  </div>
                </div>
                <QrCode size={80} className="absolute -bottom-4 -right-4 text-emerald-200/50 -rotate-12" />
              </div>
              <h3 className="text-xl font-[1000] mb-3">Dijital Menü</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Müşteriler menünüze QR ile veya işletme linkinizden ulaşabilir. Fiyatlara ve ürünlere mekana gelmeden önce de bakabilir.
              </p>
            </motion.div>

            {/* Dijital Vitrin */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="mb-8 h-40 bg-blue-50 rounded-[2rem] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bg-white p-4 rounded-3xl shadow-lg w-full space-y-3 transform rotate-2 group-hover:rotate-0 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs">LOGO</div>
                    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-50 rounded-full flex-1" />
                    <div className="h-6 bg-gray-50 rounded-full flex-1" />
                  </div>
                </div>
                <Monitor size={80} className="absolute -bottom-4 -right-4 text-blue-200/50 -rotate-12" />
              </div>
              <h3 className="text-xl font-[1000] mb-3">Dijital Vitrin</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Instagram bio’ya, Google profilinize veya masadaki QR’a koyabileceğiniz tek bir dijital vitrin.
              </p>
            </motion.div>

            {/* Uygulama İçi Kampanyalar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="mb-8 h-40 bg-amber-50 rounded-[2rem] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg transform -rotate-3 group-hover:rotate-0 transition-all font-black text-center">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">GÜNÜN FIRSATI</div>
                  <div className="text-lg">%20 İNDİRİM</div>
                </div>
                <Megaphone size={80} className="absolute -bottom-4 -right-4 text-amber-200/50 -rotate-12" />
              </div>
              <h3 className="text-xl font-[1000] mb-3">Uygulama İçi Kampanyalar</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Günlük fırsatlar, öğrenci indirimleri, happy hour ve özel kampanyalarınızı müşterilere gösterebilirsiniz.
              </p>
            </motion.div>

            {/* Müdavim Kartı */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="mb-8 h-40 bg-rose-50 rounded-[2rem] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bg-white p-4 rounded-2xl shadow-lg w-full transform rotate-1 group-hover:rotate-0 transition-transform">
                  <div className="grid grid-cols-4 gap-2">
                    {[1,2,3].map(i => <div key={i} className="aspect-square bg-rose-500 rounded-full flex items-center justify-center text-white text-[8px]"><CheckCircle size={12} weight="fill" /></div>)}
                    {[4,5,6,7,8].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-full" />)}
                  </div>
                </div>
                <Cards size={80} className="absolute -bottom-4 -right-4 text-rose-200/50 -rotate-12" />
              </div>
              <h3 className="text-xl font-[1000] mb-3">Müdavim Kartı</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                “8 kahve al, 1 kahve bizden” gibi kampanyaları dijital hale getirin. Müşteri kart kaybetmeden damga toplasın.
              </p>
            </motion.div>

            {/* Feedback */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="mb-8 h-40 bg-purple-50 rounded-[2rem] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bg-white p-4 rounded-2xl shadow-lg w-full space-y-2 transform -rotate-2 group-hover:rotate-0 transition-transform">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} weight="fill" className="text-amber-400" />)}
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full w-full" />
                  <div className="h-2 bg-gray-50 rounded-full w-2/3" />
                </div>
                <ChatTeardropDots size={80} className="absolute -bottom-4 -right-4 text-purple-200/50 -rotate-12" />
              </div>
              <h3 className="text-xl font-[1000] mb-3">Feedback</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Müşterileriniz hızlıca puan ve yorum bırakabilir. Geri bildirimleri tek yerden takip edebilirsiniz.
              </p>
            </motion.div>

            {/* Öne Çıkarma */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="mb-8 h-40 bg-indigo-50 rounded-[2rem] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="relative">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-indigo-500 animate-pulse">
                    <div className="text-[8px] font-black text-indigo-600 uppercase mb-1">Öne Çıkan Mekan</div>
                    <div className="h-3 bg-gray-100 rounded-full w-20" />
                  </div>
                </div>
                <TrendUp size={80} className="absolute -bottom-4 -right-4 text-indigo-200/50 -rotate-12" />
              </div>
              <h3 className="text-xl font-[1000] mb-3">Öne Çıkarma Alanları</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                İşletmenizi Everything ekosistemi içinde ilgili mini uygulamalarda öne çıkarma fırsatları.
              </p>
            </motion.div>
          </div>
        </section>

        {/* 4. Ekosistemin Gücü Section */}
        <section className="bg-indigo-600 py-24 mb-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl -ml-48 -mb-48" />
          
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center text-white space-y-8">
            <h2 className="text-3xl md:text-5xl font-black leading-tight">
              Tek bir sayfa değil, büyüyen bir ekosistem.
            </h2>
            <div className="space-y-6 text-lg text-indigo-50 font-medium leading-relaxed">
              <p>
                Everything, farklı ihtiyaçlar için geliştirilen modüllerden oluşan bir ekosistemdir. İşletmeniz bu ekosistemin içinde dijital menü, kampanya, müdavim kartı, müşteri geri bildirimi ve keşif alanlarıyla daha görünür hale gelir.
              </p>
              <p className="font-black text-white">
                Bugün dijital vitrininizi kurarsınız. Yarın yeni modüllerle işletmenizi daha fazla noktada gösterebilirsiniz.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Dijital ve Yenilikçi Görünme Section */}
        <section className="max-w-4xl mx-auto px-6 mb-32 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-black">İşletmenizi daha modern ve yenilikçi gösterin.</h2>
          <p className="text-lg text-gray-500 font-medium leading-relaxed">
            Müşteriler QR ile sadece menüye değil, işletmenizin tüm dijital deneyimine ulaşır. Menü, kampanyalar, sadakat kartı ve geri bildirim tek sayfada toplandığı için işletmeniz daha düzenli, modern ve profesyonel görünür.
          </p>
        </section>

        {/* 6. 1 Günde Kurulum Section */}
        <section className="bg-white py-24 mb-32 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl md:text-5xl font-black">1 günde kurulum.</h2>
                <p className="text-lg text-gray-500 font-medium leading-relaxed">
                  Menünüzü, işletme bilgilerinizi, kampanyalarınızı ve sadakat kartınızı birlikte hazırlıyoruz. İlk kurulumda teknik detaylarla uğraşmazsınız.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "İşletme sayfanız hazırlanır",
                    "Menü veya ürünleriniz eklenir",
                    "QR kodlar oluşturulur",
                    "Sadakat kartı alanı açılır",
                    "Kampanya alanı açılır",
                    "Kullanım için kısa destek"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={24} weight="fill" className="text-emerald-500 shrink-0" />
                      <span className="font-bold text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-[3rem] p-12 flex items-center justify-center border border-gray-100">
                <Clock size={120} weight="duotone" className="text-indigo-600 opacity-20" />
              </div>
            </div>
          </div>
        </section>

        {/* 7. & 8. Destek ve Birlikte Gelişelim */}
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-2xl font-black">Kurulumdan sonra yalnız değilsiniz.</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                İlk pilot sürecinde sistemi birlikte geliştiriyoruz. Menü güncellemeleri, QR kullanımı, kampanya önerileri ve müşteri geri bildirimleri konusunda düzenli destek veriyoruz.
              </p>
            </div>
            <div className="bg-indigo-50 p-12 rounded-[3rem] border border-indigo-100 space-y-6">
              <h3 className="text-2xl font-black text-indigo-900">İlk işletmelerle birlikte geliştiriyoruz.</h3>
              <p className="text-indigo-700 font-medium leading-relaxed text-sm">
                Everything for Local Businesses şu anda ilk işletmelerle birlikte şekilleniyor. Bu yüzden ilk işletmeler yalnızca kullanıcı değil, ürünün gelişiminde doğrudan etkili olacak erken partnerlerdir.
              </p>
              <p className="text-indigo-900 font-bold text-sm">
                Sizden gelen geri bildirimlerle menü, kampanya, sadakat kartı ve dijital vitrin özelliklerini gerçek işletme ihtiyaçlarına göre geliştiriyoruz.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Fiyatlar Section */}
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black">Lansmana özel fiyatlar.</h2>
            <p className="text-gray-500 text-lg font-bold">İlk işletmeler için 1 ay ücretsiz deneme ve 3 aylık özel lansman fiyatları.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white p-8 rounded-[3rem] border-2 flex flex-col ${plan.highlight ? 'border-indigo-600 shadow-2xl shadow-indigo-500/10' : 'border-gray-100 shadow-sm'} ${plan.disabled ? 'opacity-75' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                    En Popüler
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-black mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-[1000]">{plan.price}</span>
                    <span className="text-gray-400 font-bold text-sm">{plan.period}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-4 font-medium">{plan.description}</p>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={20} weight="fill" className={plan.disabled ? "text-gray-300" : "text-emerald-500"} />
                      <span className="text-sm font-bold text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={plan.disabled ? "#" : getAppRootUrl()}
                  className={`block w-full text-center py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                    plan.highlight 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20' 
                      : plan.disabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-black text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 10. Final CTA */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="bg-gray-900 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -ml-32 -mt-32" />
            <h2 className="text-3xl md:text-5xl font-[1000] text-white relative z-10 leading-tight">
              İşletmenizi dijital vitrine taşıyalım.
            </h2>
            <p className="text-gray-400 font-bold text-lg max-w-xl mx-auto relative z-10 leading-relaxed">
              İlk işletmeler için 1 ay ücretsiz deneme sunuyoruz. Sayfanızı birlikte kuralım, QR’ınızı hazırlayalım ve müşterilerinizle test edelim.
            </p>
            <div className="relative z-10 flex flex-wrap justify-center gap-4">
              <Link
                href={getAppRootUrl()}
                className="bg-white text-gray-900 px-10 py-5 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
              >
                Ücretsiz Pilot Başlat
              </Link>
              <button className="bg-transparent text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-sm hover:bg-white/5 transition-all active:scale-95">
                Demo İste
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer hideCTA={true} />
    </div>
  );
}
