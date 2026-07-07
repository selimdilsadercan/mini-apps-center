/**
 * Tarif JSON formatı — AI prompt ve editör rehberi.
 * Bu metni kopyalayıp ChatGPT / Claude vb. ile tarif üretirken kullanabilirsin.
 */
export const RECIPE_JSON_AI_INSTRUCTION = `# Tarif JSON Formatı

Aşağıdaki şemaya uygun, geçerli bir JSON nesnesi üret. Sadece JSON döndür; açıklama veya markdown kod bloğu ekleme.

## Kök yapı

\`\`\`json
{
  "title": "string — tarif adı (zorunlu)",
  "ingredients": [ /* malzeme dizisi (zorunlu, boş olabilir) */ ],
  "instructions": [ /* yapılış adımı dizisi (zorunlu, boş olabilir) */ ]
}
\`\`\`

---

## Malzeme (ingredients[])

Her öğe bir nesne:

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| name | string | evet | Malzeme adı. Yapılış metninde geçen isimle uyumlu olmalı (tooltip ve vurgulama için). |
| amount | string | hayır | Miktar ve birim. Örn: "200 g", "3 yemek kaşığı", "1 adet", "yarım paket" |
| key | string | hayır | Varyasyon anahtarı. Yoksa isimden otomatik üretilir (küçük harf, boşluk → tire). Örn: "beyaz peynir" → "beyaz-peynir" |
| optional | boolean | hayır | true ise kullanıcı tarifte bu malzemeyi açıp kapatabilir (varyasyon). Varsayılan: false (her zaman dahil) |
| defaultOn | boolean | hayır | optional=true iken başlangıçta seçili mi? Varsayılan: true. false = varsayılan kapalı |
| label | string | hayır | Varyasyon toggle'ında görünen kısa etiket. Yoksa name kullanılır. Örn: "Peynir" |

### Malzeme kuralları
- Zorunlu olmayan (optional: false veya yok) malzemeler her zaman listede görünür.
- optional: true olan malzeme, kullanıcı kapatırsa malzeme listesinden ve bağlı adımlardan çıkar.
- Aynı key birden fazla malzemede kullanılmamalı; requires bu key ile eşleşir.

---

## Yapılış adımı (instructions[])

Her öğe bir nesne:

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| index | number | hayır | Sıra numarası (editörde). Kayıtta step olarak saklanır. |
| step | number | hayır | API alanı — index ile aynı, ikisinden biri yeterli. |
| text | string | evet | Adım metni. Malzeme adları metin içinde geçmeli (kalın + tooltip için). |
| requires | string[] | hayır | Bu adımın görünmesi için seçili olması gereken malzeme key'leri. Hepsi seçili olmalı (VE mantığı). Yoksa adım her zaman gösterilir. |

### Adım kuralları
- requires içindeki her key, ingredients içinde tanımlı bir malzemenin key'i olmalı.
- Opsiyonel malzeme kapalıysa, o key'i requires eden adımlar gizlenir; kalan adımlar 1, 2, 3… diye yeniden numaralanır.
- requires olmayan adımlar her varyasyonda görünür.

---

## Yapılış metninde malzeme eşleştirme

Uygulama, instructions[].text içinde ingredients[].name ile eşleşen kelimeleri tıklanabilir yapar ve miktar tooltip'i gösterir.
- Mümkünse malzeme adını metinde aynen kullan: "beyaz peynir", "zeytinyağı".
- Çekim ekleri de eşleşebilir: "peyniri" ↔ "beyaz peynir" (kısmi eşleşme).

---

## Tam örnek (varyasyonlu)

\`\`\`json
{
  "title": "Nohut Salatası",
  "ingredients": [
    { "name": "haşlanmış nohut", "amount": "200 g" },
    { "name": "kornişon turşu", "amount": "5 adet" },
    { "name": "orta boy salatalık", "amount": "1 adet" },
    {
      "name": "beyaz peynir",
      "amount": "3 yemek kaşığı",
      "key": "peynir",
      "optional": true,
      "defaultOn": true,
      "label": "Peynir"
    },
    { "name": "köz biber", "amount": "2 adet" },
    { "name": "roka veya maydanoz", "amount": "1 demet" },
    { "name": "zeytinyağı", "amount": "3 yemek kaşığı" },
    { "name": "limon suyu", "amount": "2 yemek kaşığı" },
    { "name": "nar ekşisi", "amount": "1 yemek kaşığı" },
    { "name": "kimyon", "amount": "1 çay kaşığı" },
    { "name": "pul biber", "amount": "1 çay kaşığı" },
    { "name": "karabiber", "amount": "1 tutam" },
    { "name": "tuz", "amount": "1 tutam" }
  ],
  "instructions": [
    { "index": 1, "text": "Nohutları süzüp sudan geçir." },
    { "index": 2, "text": "Kornişon turşu, salatalık, köz biber ve yeşilliği küçük küçük doğra." },
    {
      "index": 3,
      "text": "Nohut, doğranmış malzemeler ve beyaz peyniri bir kaba al.",
      "requires": ["peynir"]
    },
    {
      "index": 4,
      "text": "Ayrı bir kapta zeytinyağı, limon suyu, nar ekşisi, kimyon, pul biber, karabiber ve tuzu karıştır."
    },
    { "index": 5, "text": "Sosu salatanın üzerine dök, karıştır ve servis et." }
  ]
}
\`\`\`

Peynir varyasyonu kapalıyken: "beyaz peynir" malzemeden ve index 3 adımından çıkar; kalan adımlar yeniden numaralanır.

---

## AI'ya verilecek kısa prompt şablonu

> Aşağıdaki tarifi yukarıdaki JSON şemasına uygun olarak yaz. Varyasyon gerekiyorsa optional malzeme + requires adımı ekle. Sadece geçerli JSON döndür.
>
> [Buraya tarif metnini yapıştır]

---

## Sık hatalar

- requires içinde olmayan veya yanlış yazılmış key → adım hiç görünmez veya yanlış davranır
- optional malzeme için key verilmezse otomatik key kullanılır; requires'ta aynı otomatik key'i kullan veya explicit key yaz
- title boş veya ingredients/instructions dizi değil → kayıt reddedilir
- instructions içinde index kullanılabilir; kayıtta otomatik olarak step'e dönüştürülür
`;

export const RECIPE_JSON_EXAMPLE = `{
  "title": "Nohut Salatası",
  "ingredients": [
    { "name": "haşlanmış nohut", "amount": "200 g" },
    { "name": "beyaz peynir", "amount": "3 yemek kaşığı", "key": "peynir", "optional": true, "defaultOn": true, "label": "Peynir" }
  ],
  "instructions": [
    { "index": 1, "text": "Nohutları süzüp sudan geçir." },
    { "index": 2, "text": "Nohut ve beyaz peyniri bir kaba al.", "requires": ["peynir"] }
  ]
}`;
