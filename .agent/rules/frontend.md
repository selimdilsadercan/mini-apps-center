# Frontend Development Rules

- **No Build Commands**: Asla production build (`npm run build`, `bun run build` vb.) komutlarını çalıştırma. Bu işlem gereksiz kaynak tüketimine yol açmaktadır.
- **No Browser Alerts**: Standart tarayıcı `alert()` veya `confirm()` fonksiyonlarını kesinlikle kullanma. Bunun yerine her zaman projede tanımlı olan `useConfirmDialog` (ConfirmDialogProvider) kullan.
- **Back Button Mandatory**: Her mini-app'in mutlaka bir "Geri" (Katalog/Ana Sayfa) tuşu olmalıdır.
- **Subdomain Redirect & Back Button URL**: Mini-app'lerin geri butonları her zaman `my` subdomain'ini açmalıdır. Bunu sağlamak için `window.location.href = getAppRootUrl()` kullanılmalıdır (import `getAppRootUrl` from `@/lib/apps`).
- **Subdomain Environment Rule**: Local development ortamında subdomain yönlendirmeleri devre dışıdır ve uygulamalar `/apps/[app-id]` üzerinden aynı domainde çalışır. Production (canlı) ortamda ise subdomain yönlendirmeleri (`subdomain.[domain]`) aktiftir. Bu ayrım `getAppHref` fonksiyonu tarafından otomatik yönetilir.
