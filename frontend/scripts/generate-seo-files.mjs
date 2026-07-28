import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parsePublishedApps(appsTs) {
  const blocks = appsTs.split(/\{\s*\n\s*id:/).slice(1);
  const apps = [];
  for (const b of blocks) {
    const id = b.match(/^\s*"([^"]+)"/)?.[1];
    const name = b.match(/name:\s*"([^"]+)"/)?.[1];
    const description = b.match(/description:\s*"([^"]+)"/)?.[1];
    const category = b.match(/category:\s*"([^"]+)"/)?.[1];
    const cancelled = b.includes("isCancelled: true");
    const implemented = b.includes("isImplemented: true");
    if (id && implemented && !cancelled && name && description) {
      apps.push({ id, name, description, category });
    }
  }
  const seen = new Set();
  return apps.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

const appsTs = fs.readFileSync(path.join(root, "lib/apps.ts"), "utf8");
const apps = parsePublishedApps(appsTs);
const seoDir = path.join(root, "content/apps-seo");

fs.mkdirSync(seoDir, { recursive: true });

for (const app of apps) {
  const filePath = path.join(seoDir, app.id + ".md");
  const content = `# ${app.name} SEO İçeriği

## Kısa Açıklama (Katalogda görünür)
${app.description}

## SEO Meta Açıklaması
${app.description} Everything super app ile ücretsiz ve tarayıcıda anında çalışır.

## Anahtar Kelimeler
${app.name}, everything, mini uygulama, ücretsiz araç, ${app.category || "pratik araçlar"}, online tool

## Sayfa İçeriği (SEO Yazısı)
Everything super app içindeki ${app.name} uygulaması ile ${app.description.toLowerCase()}

### Özellikler
- Tamamen ücretsiz
- Kurulum gerektirmez
- Mobil ve web uyumlu
- Hızlı ve güvenli

### Nasıl Kullanılır?
Uygulamayı aç butonuna tıklayarak doğrudan tarayıcı üzerinden kullanmaya başlayabilirsiniz. Hesabınızla giriş yaparak verilerinizin senkronize kalmasını sağlayabilirsiniz.
`;

  fs.writeFileSync(filePath, content);
}

console.log(`Successfully generated ${apps.length} SEO markdown files in ${seoDir}`);
