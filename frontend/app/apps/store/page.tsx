"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast, Toaster } from "react-hot-toast";
import {
  Storefront,
  Plus,
  Pencil,
  Trash,
  WhatsappLogo,
  InstagramLogo,
  EnvelopeSimple,
  MagnifyingGlass,
  ArrowRight,
  User,
  ImageSquare,
  Sparkle,
} from "@phosphor-icons/react";
import StoreShell from "./components/StoreShell";
import type { Store, Product, ProductWithStore } from "./types";
import {
  getStoreByUserAction,
  createStoreAction,
  updateStoreAction,
  getStoreProductsAction,
  getAllProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "./actions";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// Unsplash Preset Images for Handcrafted items
const PRESET_IMAGES = [
  { url: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80", label: "Örgü Oyuncak" },
  { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80", label: "El Örgüsü Kazak" },
  { url: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=600&auto=format&fit=crop&q=80", label: "Yün Yelek / Hırka" },
  { url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80", label: "Örgü Çanta" },
  { url: "https://images.unsplash.com/photo-1580748141549-71748d80ba99?w=600&auto=format&fit=crop&q=80", label: "Sevimli Amigurumi" },
];

const CATEGORIES = ["Oyuncak", "Hırka", "Kazak", "Çanta", "Aksesuar", "Ev Dekoru", "Diğer"];
const CATEGORIES_EN_MAP: Record<string, string> = {
  Oyuncak: "Toy",
  Hırka: "Cardigan",
  Kazak: "Sweater",
  Çanta: "Bag",
  Aksesuar: "Accessory",
  "Ev Dekoru": "Home Decor",
  Diğer: "Other",
};

export default function StorePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { locale } = useLanguage();
  const { confirm } = useConfirmDialog();
  const [isPending, startTransition] = useTransition();

  // Navigation state
  const [activeTab, setActiveTab] = useState<"discover" | "my-store">("discover");

  // Core Data State
  const [allProducts, setAllProducts] = useState<ProductWithStore[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStore[]>([]);
  const [myStore, setMyStore] = useState<Store | null>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);

  // UI Filtering State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Loading States
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingStore, setLoadingStore] = useState(true);

  // Modal / Drawer control states
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Selected item states for drawers
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStore | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // null means create mode

  // Form States - Store Setup / Edit
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeWhatsapp, setStoreWhatsapp] = useState("");
  const [storeInstagram, setStoreInstagram] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [storeBannerUrl, setStoreBannerUrl] = useState("");

  // Form States - Product
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("Oyuncak");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);

  // Initialize and Fetch discover data
  useEffect(() => {
    fetchDiscoverFeed();
  }, []);

  // Fetch store data once user details load
  useEffect(() => {
    if (isUserLoaded) {
      fetchMyStoreData();
    }
  }, [isUserLoaded, user?.id]);

  // Apply filters on search or category select
  useEffect(() => {
    let result = allProducts;
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.store_name.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, allProducts]);

  const fetchDiscoverFeed = async () => {
    try {
      setLoadingDiscover(true);
      const res = await getAllProductsAction();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setAllProducts(res.data ?? []);
    } finally {
      setLoadingDiscover(false);
    }
  };

  const fetchMyStoreData = async () => {
    try {
      setLoadingStore(true);
      if (!user) {
        setMyStore(null);
        setMyProducts([]);
        return;
      }

      const resStore = await getStoreByUserAction(user.id);
      if (resStore.error) {
        // Suppress toast if it's just a 404 (store not created yet)
        setMyStore(null);
        return;
      }

      if (resStore.data) {
        setMyStore(resStore.data);
        // Load products for this store
        const resProds = await getStoreProductsAction(resStore.data.id);
        if (resProds.data) {
          setMyProducts(resProds.data);
        }
      } else {
        setMyStore(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStore(false);
    }
  };

  const handleOpenEditStore = () => {
    if (myStore) {
      setStoreName(myStore.name);
      setStoreDescription(myStore.description ?? "");
      setStoreWhatsapp(myStore.contact_whatsapp ?? "");
      setStoreInstagram(myStore.contact_instagram ?? "");
      setStoreEmail(myStore.contact_email ?? "");
      setStoreLogoUrl(myStore.logo_url ?? "");
      setStoreBannerUrl(myStore.banner_url ?? "");
    } else {
      setStoreName("");
      setStoreDescription("");
      setStoreWhatsapp("");
      setStoreInstagram("");
      setStoreEmail(user?.primaryEmailAddress?.emailAddress ?? "");
      setStoreLogoUrl(user?.imageUrl ?? "");
      setStoreBannerUrl("linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"); // Soft amber gradient
    }
    setIsStoreDrawerOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!storeName.trim() || !storeWhatsapp.trim()) {
      toast.error(locale === "tr" ? "Lütfen Mağaza Adı ve WhatsApp bilgilerini girin." : "Please fill in Store Name and WhatsApp.");
      return;
    }

    // Format WhatsApp number to clean format if needed
    let cleanWhatsapp = storeWhatsapp.trim();
    if (!cleanWhatsapp.startsWith("+") && !cleanWhatsapp.startsWith("http")) {
      // Add default +90 if number looks like local phone
      if (cleanWhatsapp.startsWith("0")) {
        cleanWhatsapp = "+9" + cleanWhatsapp;
      } else if (cleanWhatsapp.length === 10) {
        cleanWhatsapp = "+90" + cleanWhatsapp;
      }
    }

    startTransition(async () => {
      let res;
      if (myStore) {
        res = await updateStoreAction({
          storeId: myStore.id,
          userId: user.id,
          name: storeName.trim(),
          description: storeDescription.trim() || null,
          logoUrl: storeLogoUrl.trim() || null,
          bannerUrl: storeBannerUrl.trim() || null,
          contactWhatsapp: cleanWhatsapp,
          contactInstagram: storeInstagram.trim() || null,
          contactEmail: storeEmail.trim() || null,
        });
      } else {
        res = await createStoreAction({
          userId: user.id,
          name: storeName.trim(),
          description: storeDescription.trim() || null,
          logoUrl: storeLogoUrl.trim() || null,
          bannerUrl: storeBannerUrl.trim() || null,
          contactWhatsapp: cleanWhatsapp,
          contactInstagram: storeInstagram.trim() || null,
          contactEmail: storeEmail.trim() || null,
        });
      }

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(locale === "tr" ? "Mağaza profili kaydedildi!" : "Store profile saved successfully!");
      setIsStoreDrawerOpen(false);
      fetchMyStoreData();
      fetchDiscoverFeed();
    });
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdDescription("");
    setProdPrice("");
    setProdCategory("Oyuncak");
    // Pick a random preset image by default
    const randomPreset = PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)];
    setProdImageUrl(randomPreset.url);
    setProdAvailable(true);
    setIsProductDrawerOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDescription(prod.description ?? "");
    setProdPrice(prod.price.toString());
    setProdCategory(prod.category);
    setProdImageUrl(prod.image_urls?.[0] ?? "");
    setProdAvailable(prod.is_available);
    setIsProductDrawerOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !myStore) return;
    if (!prodName.trim() || !prodPrice.trim() || !prodCategory) {
      toast.error(locale === "tr" ? "Lütfen gerekli alanları doldurun." : "Please fill in required fields.");
      return;
    }

    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error(locale === "tr" ? "Geçersiz fiyat bilgisi." : "Invalid price amount.");
      return;
    }

    const imgUrls = prodImageUrl.trim() ? [prodImageUrl.trim()] : [];

    startTransition(async () => {
      let res;
      if (editingProduct) {
        res = await updateProductAction({
          productId: editingProduct.id,
          userId: user.id,
          name: prodName.trim(),
          description: prodDescription.trim() || null,
          price: priceNum,
          category: prodCategory,
          imageUrls: imgUrls,
          isAvailable: prodAvailable,
        });
      } else {
        res = await createProductAction({
          userId: user.id,
          storeId: myStore.id,
          name: prodName.trim(),
          description: prodDescription.trim() || null,
          price: priceNum,
          category: prodCategory,
          imageUrls: imgUrls,
        });
      }

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        editingProduct
          ? (locale === "tr" ? "Ürün güncellendi!" : "Product updated!")
          : (locale === "tr" ? "Ürün başarıyla eklendi!" : "Product added successfully!")
      );
      setIsProductDrawerOpen(false);
      fetchMyStoreData();
      fetchDiscoverFeed();
    });
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!user) return;
    const isConfirmed = await confirm({
      title: locale === "tr" ? "Ürünü Sil" : "Delete Product",
      description:
        locale === "tr"
          ? "Bu ürünü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          : "Are you sure you want to delete this product? This action cannot be undone.",
      confirmText: locale === "tr" ? "Sil" : "Delete",
      cancelText: locale === "tr" ? "İptal" : "Cancel",
      variant: "danger",
    });

    if (!isConfirmed) return;

    startTransition(async () => {
      const res = await deleteProductAction(prodId, user.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(locale === "tr" ? "Ürün silindi." : "Product deleted.");
      fetchMyStoreData();
      fetchDiscoverFeed();
    });
  };

  const getContactLink = (type: "whatsapp" | "instagram" | "email", targetStore: Store | ProductWithStore) => {
    const wWhatsapp = "contact_whatsapp" in targetStore ? targetStore.contact_whatsapp : null;
    const wInsta = "contact_instagram" in targetStore ? targetStore.contact_instagram : null;
    const wEmail = "contact_email" in targetStore ? targetStore.contact_email : null;

    const storeDetails = targetStore as any;
    const finalWhatsapp = wWhatsapp || storeDetails.store_whatsapp || "";
    const finalInstagram = wInsta || storeDetails.store_instagram || "";
    const finalEmail = wEmail || storeDetails.store_email || "";

    const messageText = encodeURIComponent(
      locale === "tr"
        ? `Merhaba! Katalog Mağazası'nda gördüğüm "${selectedProduct?.name}" (${selectedProduct?.price} ${selectedProduct?.currency}) ürünü hakkında bilgi alabilir miyim?`
        : `Hello! I saw your product "${selectedProduct?.name}" (${selectedProduct?.price} ${selectedProduct?.currency}) on the Catalog Store and would like to get more information.`
    );

    if (type === "whatsapp") {
      let phone = finalWhatsapp.replace(/\s+/g, "").replace("+", "");
      return `https://wa.me/${phone}?text=${messageText}`;
    }

    if (type === "instagram") {
      let insta = finalInstagram.trim().replace("@", "");
      return `https://instagram.com/${insta}`;
    }

    return `mailto:${finalEmail}?subject=Katalog%20Mağazası%20-%20${encodeURIComponent(selectedProduct?.name || "")}&body=${messageText}`;
  };

  // Tabs layout component
  const renderSegmentTabs = () => (
    <div className="flex justify-center w-full">
      <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
        <button
          onClick={() => setActiveTab("discover")}
          className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
            activeTab === "discover"
              ? "bg-app-tab-active text-app-text shadow-sm"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          {locale === "tr" ? "Keşfet" : "Discover"}
        </button>
        <button
          onClick={() => setActiveTab("my-store")}
          className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
            activeTab === "my-store"
              ? "bg-app-tab-active text-app-text shadow-sm"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          {locale === "tr" ? "Mağazam" : "My Store"}
        </button>
      </div>
    </div>
  );

  return (
    <StoreShell tabs={renderSegmentTabs()}>
      <Toaster position="top-center" />

      {activeTab === "discover" ? (
        <div className="space-y-4">
          {/* Search bar & Category quick tags */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-app-muted">
              <MagnifyingGlass size={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "tr" ? "Ürün veya mağaza ara..." : "Search products or stores..."}
              className="w-full pl-11 pr-4 py-3 bg-app-surface border border-app-border rounded-2xl text-sm font-bold text-app-text outline-none placeholder:text-app-muted focus:border-amber-500/40"
            />
          </div>

          {/* Categories tag slider */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 transition-all ${
                selectedCategory === null
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "bg-app-surface border-app-border text-app-muted hover:text-app-text"
              }`}
            >
              {locale === "tr" ? "Tümü" : "All"}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 transition-all ${
                  selectedCategory === cat
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "bg-app-surface border-app-border text-app-muted hover:text-app-text"
                }`}
              >
                {locale === "tr" ? cat : (CATEGORIES_EN_MAP[cat] || cat)}
              </button>
            ))}
          </div>

          {/* Discover Catalog Grid */}
          {loadingDiscover ? (
            <div className="py-20 text-center text-xs font-bold text-app-muted uppercase tracking-widest animate-pulse">
              {locale === "tr" ? "Katalog Yükleniyor..." : "Loading Catalog..."}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-app-surface border border-app-border rounded-3xl p-8 flex flex-col items-center">
              <Storefront size={40} className="text-app-muted mb-3" weight="duotone" />
              <p className="text-sm font-bold text-app-muted">
                {locale === "tr" ? "Uyumlu ürün bulunamadı." : "No products found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod);
                    setIsDetailDrawerOpen(true);
                  }}
                  className="group bg-app-surface border border-app-border rounded-2xl p-2.5 shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col h-full"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-app-surface-muted mb-2">
                    <img
                      src={prod.image_urls?.[0] || "https://images.unsplash.com/photo-1608248597481-496100c80836?w=400"}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white tracking-wider">
                      {locale === "tr" ? prod.category : (CATEGORIES_EN_MAP[prod.category] || prod.category)}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between px-1">
                    <div>
                      <h3 className="text-sm font-black text-app-text tracking-tight truncate leading-snug">
                        {prod.name}
                      </h3>
                      {/* Store name and small logo preview */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Storefront size={12} className="text-amber-600 dark:text-amber-500" weight="fill" />
                        <span className="text-[10px] font-bold text-app-muted truncate">
                          {prod.store_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-app-border/40">
                      <span className="text-sm font-black text-amber-600 dark:text-amber-500">
                        {prod.price} {prod.currency}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-app-muted group-hover:text-amber-600 transition-colors flex items-center gap-0.5">
                        {locale === "tr" ? "İncele" : "Detail"}
                        <ArrowRight size={10} weight="bold" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ==================== MY STORE DASHBOARD ==================== */
        <div className="space-y-4">
          {!isUserLoaded || loadingStore ? (
            <div className="py-20 text-center text-xs font-bold text-app-muted uppercase tracking-widest animate-pulse">
              {locale === "tr" ? "Yükleniyor..." : "Loading..."}
            </div>
          ) : !user ? (
            /* User not logged in state */
            <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
              <Storefront size={40} className="text-app-muted mb-4" weight="duotone" />
              <p className="text-sm font-bold text-app-muted mb-4">
                {locale === "tr" ? "Mağazanızı yönetmek ve ürün eklemek için lütfen giriş yapın." : "Please log in to manage your store and list products."}
              </p>
            </div>
          ) : !myStore ? (
            /* User does not have a store profile yet */
            <div className="bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mx-auto">
                <Sparkle size={24} weight="duotone" />
              </div>
              <h2 className="text-lg font-black tracking-tight uppercase text-app-text">
                {locale === "tr" ? "Kendi Mağazanızı Kurun" : "Set Up Your Store"}
              </h2>
              <p className="text-sm text-app-muted leading-relaxed">
                {locale === "tr"
                  ? "Kendi butik sayfanızı dakikalar içinde hazırlayın. El emeği ve örgü ürünlerinizi sergileyin, fiyatlarını listeleyin ve müşterilerin doğrudan WhatsApp'tan size yazmasını sağlayın!"
                  : "Set up your own boutique showcase in minutes. Display your handcrafted products, present prices, and let customers reach you directly on WhatsApp!"}
              </p>
              <button
                onClick={handleOpenEditStore}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                {locale === "tr" ? "Butik Mağaza Profili Oluştur" : "Create Boutique Profile"}
              </button>
            </div>
          ) : (
            /* Active Store Profile View */
            <div className="space-y-6">
              {/* Store Header Card */}
              <div className="relative overflow-hidden bg-app-surface border border-app-border rounded-3xl shadow-sm">
                <div
                  className="h-24 w-full bg-cover bg-center"
                  style={{
                    background: myStore.banner_url || "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  }}
                />
                <div className="px-5 pb-5 pt-0 relative flex flex-col">
                  {/* Store logo/avatar */}
                  <div className="w-16 h-16 rounded-2xl border-4 border-app-surface bg-app-surface-muted overflow-hidden -mt-8 mb-3 shadow-md">
                    <img
                      src={myStore.logo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={myStore.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-app-text tracking-tight uppercase">
                        {myStore.name}
                      </h2>
                      {myStore.description && (
                        <p className="text-xs text-app-muted mt-1 leading-relaxed">
                          {myStore.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleOpenEditStore}
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-app-border text-app-muted hover:text-app-text bg-app-bg transition-all active:scale-95"
                    >
                      <Pencil size={14} weight="bold" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-app-border/40 text-[11px] font-bold text-app-muted">
                    {myStore.contact_whatsapp && (
                      <span className="flex items-center gap-1">
                        <WhatsappLogo size={14} weight="fill" className="text-green-500" />
                        {locale === "tr" ? "WhatsApp Aktif" : "WhatsApp Active"}
                      </span>
                    )}
                    {myStore.contact_instagram && (
                      <span className="flex items-center gap-1">
                        <InstagramLogo size={14} weight="fill" className="text-pink-500" />
                        {myStore.contact_instagram}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Title & Action */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-tight text-app-text">
                  {locale === "tr" ? "Ürünlerim" : "My Products"}
                </h3>
                <button
                  onClick={handleOpenAddProduct}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={12} weight="bold" />
                  {locale === "tr" ? "Ürün Ekle" : "Add Product"}
                </button>
              </div>

              {/* User's Products list */}
              {myProducts.length === 0 ? (
                <div className="py-12 text-center bg-app-surface-muted border border-dashed border-app-border rounded-2xl p-6">
                  <p className="text-xs font-bold text-app-muted">
                    {locale === "tr" ? "Henüz eklenmiş ürün yok. İlk ürününüzü hemen ekleyin!" : "No products added yet. Add your first product now!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {myProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-app-surface border border-app-border rounded-2xl p-2.5 shadow-sm flex flex-col h-full justify-between"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-app-surface-muted mb-2">
                        <img
                          src={prod.image_urls?.[0] || "https://images.unsplash.com/photo-1608248597481-496100c80836?w=400"}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white tracking-wider">
                          {locale === "tr" ? prod.category : (CATEGORIES_EN_MAP[prod.category] || prod.category)}
                        </span>
                        {!prod.is_available && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white px-2 py-1 rounded bg-red-600/90 shadow">
                              {locale === "tr" ? "Tükendi" : "Out of Stock"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-app-text tracking-tight truncate leading-snug">
                          {prod.name}
                        </h4>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-500 mt-1 block">
                          {prod.price} {prod.currency}
                        </span>
                      </div>

                      {/* Product Actions */}
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-app-border/40">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-app-border text-app-muted hover:text-app-text bg-app-bg text-[10px] font-bold transition-all active:scale-95"
                        >
                          <Pencil size={10} weight="bold" />
                          {locale === "tr" ? "Düzenle" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="px-2.5 flex items-center justify-center py-1.5 rounded-lg border border-red-200/60 text-red-500 hover:bg-red-500/10 bg-red-500/5 text-[10px] font-bold transition-all active:scale-95"
                        >
                          <Trash size={10} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== DRAWERS (MODALS) ==================== */}

      {/* 1. STORE PROFILE CREATE/EDIT DRAWER */}
      <Drawer open={isStoreDrawerOpen} onOpenChange={setIsStoreDrawerOpen}>
        <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
          <DrawerHeader className="px-4 pt-4 pb-0 text-left">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight flex items-center gap-1.5">
              <Storefront size={18} className="text-amber-600" weight="fill" />
              {myStore ? (locale === "tr" ? "Profili Düzenle" : "Edit Profile") : (locale === "tr" ? "Yeni Butik Kur" : "Set Up Boutique")}
            </DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleSaveStore} className="px-4 pb-8 pt-3 space-y-4 overflow-y-auto max-h-[80vh] scrollbar-none">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "Mağaza Adı (Zorunlu)" : "Store Name (Required)"}
              </label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={locale === "tr" ? "Örn: Fatma'nın Örgüleri" : "e.g., Emily's Handcrafts"}
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "Açıklama" : "Description"}
              </label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder={locale === "tr" ? "Kendinizden ve el emeği ürünlerinizden bahsedin..." : "Tell customers about your handcrafted items..."}
                className="w-full px-4 py-2.5 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40 min-h-[70px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "WhatsApp Numarası (Zorunlu)" : "WhatsApp Number (Required)"}
              </label>
              <input
                value={storeWhatsapp}
                onChange={(e) => setStoreWhatsapp(e.target.value)}
                placeholder={locale === "tr" ? "Örn: +905051234567" : "e.g., +905051234567"}
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "Instagram Kullanıcı Adı" : "Instagram Username"}
              </label>
              <input
                value={storeInstagram}
                onChange={(e) => setStoreInstagram(e.target.value)}
                placeholder={locale === "tr" ? "Örn: @fatma_orgu" : "e.g., @emily_crafts"}
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "E-posta Adresi" : "Email Address"}
              </label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "Logo / Profil Resmi URL" : "Logo / Profile Image URL"}
              </label>
              <input
                value={storeLogoUrl}
                onChange={(e) => setStoreLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
            >
              {isPending ? (locale === "tr" ? "Kaydediliyor..." : "Saving...") : (locale === "tr" ? "Kaydet" : "Save")}
            </button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* 2. PRODUCT ADD / EDIT DRAWER */}
      <Drawer open={isProductDrawerOpen} onOpenChange={setIsProductDrawerOpen}>
        <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
          <DrawerHeader className="px-4 pt-4 pb-0 text-left">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight flex items-center gap-1.5">
              <Plus size={18} className="text-amber-600" weight="bold" />
              {editingProduct ? (locale === "tr" ? "Ürünü Güncelle" : "Update Product") : (locale === "tr" ? "Yeni Ürün Ekle" : "Add New Product")}
            </DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleSaveProduct} className="px-4 pb-8 pt-3 space-y-4 overflow-y-auto max-h-[80vh] scrollbar-none">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "Ürün Adı (Zorunlu)" : "Product Name (Required)"}
              </label>
              <input
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder={locale === "tr" ? "Örn: Amigurumi Örgü Ayıcık" : "e.g., Amigurumi Teddy Bear"}
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                  {locale === "tr" ? "Fiyat (TRY) (Zorunlu)" : "Price (TRY) (Required)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="250.00"
                  className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                  {locale === "tr" ? "Kategori" : "Category"}
                </label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {locale === "tr" ? cat : (CATEGORIES_EN_MAP[cat] || cat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                {locale === "tr" ? "Ürün Açıklaması" : "Product Description"}
              </label>
              <textarea
                value={prodDescription}
                onChange={(e) => setProdDescription(e.target.value)}
                placeholder={locale === "tr" ? "Ürünün boyutu, kullanılan iplik, renk seçenekleri vb. bilgileri yazın..." : "Details like size, materials, yarn type, etc..."}
                className="w-full px-4 py-2.5 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40 min-h-[70px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-app-muted tracking-wider flex items-center justify-between">
                <span>{locale === "tr" ? "Ürün Görsel URL'si" : "Product Image URL"}</span>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">
                  {locale === "tr" ? "Önizleme görseli atandı" : "Mockup preset auto-assigned"}
                </span>
              </label>
              <input
                value={prodImageUrl}
                onChange={(e) => setProdImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-amber-500/40"
              />
            </div>

            {/* Quick Presets Picker */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-app-muted tracking-wider block">
                {locale === "tr" ? "Hazır Görsel Şablonları" : "Image Presets"}
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProdImageUrl(preset.url)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold shrink-0 transition-all active:scale-95 ${
                      prodImageUrl === preset.url
                        ? "bg-amber-600/10 border-amber-600 text-amber-700 dark:text-amber-400"
                        : "bg-app-surface border-app-border text-app-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {editingProduct && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-app-surface-muted border border-app-border">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-app-text">
                    {locale === "tr" ? "Stokta Var / Satışta" : "In Stock / Available"}
                  </span>
                  <span className="text-[10px] text-app-muted">
                    {locale === "tr" ? "Tükenirse kapatabilirsiniz" : "Disable if sold out"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prodAvailable}
                  onChange={(e) => setProdAvailable(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
            >
              {isPending ? (locale === "tr" ? "Kaydediliyor..." : "Saving...") : (locale === "tr" ? "Kaydet" : "Save")}
            </button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* 3. PRODUCT DETAIL DRAWER */}
      <Drawer open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
        <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
          {selectedProduct && (
            <div className="overflow-y-auto max-h-[85vh] scrollbar-none pb-8">
              {/* Image banner */}
              <div className="relative aspect-[4/3] w-full bg-app-surface-muted">
                <img
                  src={selectedProduct.image_urls?.[0] || "https://images.unsplash.com/photo-1608248597481-496100c80836?w=600"}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase text-white tracking-wider">
                  {locale === "tr" ? selectedProduct.category : (CATEGORIES_EN_MAP[selectedProduct.category] || selectedProduct.category)}
                </span>
              </div>

              <div className="px-5 pt-4 space-y-4">
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-black text-app-text tracking-tight uppercase leading-snug">
                      {selectedProduct.name}
                    </h2>
                    {/* Store Link preview */}
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500">
                      <Storefront size={14} weight="fill" />
                      <span>{selectedProduct.store_name}</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-500 shrink-0">
                    {selectedProduct.price} {selectedProduct.currency}
                  </span>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-app-surface-muted border border-app-border">
                    <h4 className="text-[10px] font-black uppercase text-app-muted tracking-wider">
                      {locale === "tr" ? "Ürün Açıklaması" : "Description"}
                    </h4>
                    <p className="text-sm text-app-text leading-relaxed whitespace-pre-line">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {/* Contact Options Banner */}
                <div className="space-y-3 pt-3 border-t border-app-border/60">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-wider text-center">
                    {locale === "tr" ? "Müşteri İletişimi" : "Contact Seller"}
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={getContactLink("whatsapp", selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm"
                    >
                      <WhatsappLogo size={18} weight="fill" />
                      WhatsApp
                    </a>

                    {/* Instagram/Email conditional links */}
                    {(selectedProduct as any).store_instagram || (selectedProduct as any).contact_instagram ? (
                      <a
                        href={getContactLink("instagram", selectedProduct)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm"
                      >
                        <InstagramLogo size={18} weight="fill" />
                        Instagram
                      </a>
                    ) : (
                      <a
                        href={getContactLink("email", selectedProduct)}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-app-surface border border-app-border text-app-text hover:bg-app-surface-muted text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm"
                      >
                        <EnvelopeSimple size={18} weight="fill" />
                        {locale === "tr" ? "E-posta" : "Email"}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </StoreShell>
  );
}
