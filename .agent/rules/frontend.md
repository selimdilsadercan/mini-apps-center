# Frontend Development Rules

- **No Build Commands**: Asla production build (`npm run build`, `bun run build` vb.) komutlarını çalıştırma. Bu işlem gereksiz kaynak tüketimine yol açmaktadır.
- **No Browser Alerts**: Standart tarayıcı `alert()` veya `confirm()` fonksiyonlarını kesinlikle kullanma. Bunun yerine her zaman projede tanımlı olan `useConfirmDialog` (ConfirmDialogProvider) kullan.
- **Back Button Mandatory**: Her mini-app'in mutlaka bir "Geri" (Katalog/Ana Sayfa) tuşu olmalıdır.
- **Subdomain Redirect & Back Button URL**: Mini-app'lerin geri butonları her zaman `my` subdomain'ini açmalıdır. Bunu sağlamak için `window.location.href = getAppRootUrl()` kullanılmalıdır (import `getAppRootUrl` from `@/lib/apps`).
- **Subdomain Environment Rule**: Local development ortamında subdomain yönlendirmeleri devre dışıdır ve uygulamalar `/apps/[app-id]` üzerinden aynı domainde çalışır. Production (canlı) ortamda ise subdomain yönlendirmeleri (`subdomain.[domain]`) aktiftir. Bu ayrım `getAppHref` fonksiyonu tarafından otomatik yönetilir.
- **Dynamic Routes & Static Export**: `output: "export"` (Capacitor build) kullanıldığında, dynamic route içeren sayfalar (`[id]`, `[projectId]` vb.) için `generateStaticParams` zorunludur.
  - Interactive logic içeren sayfaları `page.tsx` (Server Component) ve `*Client.tsx` (Client Component) olarak ayır.
  - `page.tsx` içinde `generateStaticParams` fonksiyonunu tanımla ve build sırasında hata almamak için dummy bir değer döndür (örn: `return [{ id: "dummy" }]`).
  - `page.tsx` içinde `params` değerini `use(params)` ile al ve Client Component'e prop olarak aktar.
  - Client Component içinde bu prop'u kullanarak veriyi fetch et.
- **Bottom Sheet (Vaul)**: Modal, katalog seçimi ve form drawer'ları için `vaul` kütüphanesini kullan (`import { Drawer } from "vaul"`). Standart tarayıcı modal'ı veya elle yazılmış `fixed` overlay kullanma.
  - **Web max-width:** `Drawer.Content` her zaman sayfa ile aynı genişlikte ortalanmalı: `fixed bottom-0 left-0 right-0 max-w-xl mx-auto w-full`.
  - **Yükseklik:** `max-h-[85vh]` veya `max-h-[90dvh]`; içerik kaydırılabilir olsun (`flex flex-col` + scroll alanı `flex-1 overflow-y-auto`).
  - **Tutma çubuğu:** Üstte `mx-auto w-10 h-1 rounded-full bg-gray-200` drag handle ekle.
  - **Başlık:** `Drawer.Title` kullan (erişilebilirlik).
  - **Kapatma:** `onOpenChange={(open) => !open && onClose()}` ile swipe-down ve overlay tıklamasını destekle.
  - **Overlay:** `Drawer.Overlay className="fixed inset-0 bg-black/40 z-40"`.
  - **Örnek:**
    ```tsx
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-gray-200/60 bg-white shadow-2xl outline-none">
          <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
          <Drawer.Title className="px-4 text-lg font-black text-gray-900">Başlık</Drawer.Title>
          <div className="flex-1 overflow-y-auto px-4 pb-6">{/* içerik */}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    ```
