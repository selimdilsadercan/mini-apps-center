"use client";

import { useUser } from "@clerk/clerk-react";
import { MINI_APPS, MiniApp, navigateToMiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { Sparkle, Plus, Check, ArrowsOutCardinal, Storefront, ChefHat, ChatTeardropDots, Diamond, ShieldCheck, SquaresFour } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import AppBar, { ActivePage } from "@/components/AppBar";
import { getUserPreferencesAction, updateAppOrderAction } from "./actions";
import { toast } from "react-hot-toast";
import { useTranslations } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Home() {
  const { isLoaded, user } = useUser();
  const { isAdmin, loading: isAdminLoading } = useIsAdmin();
  const router = useRouter();
  const t = useTranslations("home");

  // State for apps and edit mode
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);


  // Load apps and custom order
  useEffect(() => {
    async function loadOrder() {
      try {
        const implementedApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);

        let orderIds: string[] | null = null;

        // Try backend first if user is logged in
        if (user?.id) {
          const { data, error } = await getUserPreferencesAction(user.id);
          if (data?.appOrder && data.appOrder.length > 0) {
            orderIds = data.appOrder;
          }
        }

        // Fallback to localStorage
        if (!orderIds) {
          const savedOrder = localStorage.getItem(
            `app_order_${user?.id || "guest"}`,
          );
          if (savedOrder) {
            try {
              orderIds = JSON.parse(savedOrder) as string[];
            } catch (e) {}
          }
        }

        if (orderIds) {
          // Only show apps that are explicitly in the orderIds list
          const orderedApps = orderIds
            .map((id) => implementedApps.find((app) => app.id === id))
            .filter((app): app is MiniApp => !!app);
          setApps(orderedApps);
        } else {
          // Default: install all implemented apps on first load
          setApps(implementedApps);
          const defaultOrder = implementedApps.map((a) => a.id);
          localStorage.setItem(
            `app_order_${user?.id || "guest"}`,
            JSON.stringify(defaultOrder),
          );
          if (user?.id) {
            updateAppOrderAction(user.id, defaultOrder);
          }
        }
      } finally {
        setIsAppsLoading(false);
      }
    }

    if (isLoaded) {
      loadOrder();
    }
  }, [user?.id, isLoaded]);

  // Save order to localStorage and backend
  const saveOrder = async (newApps: MiniApp[]) => {
    const orderIds = newApps.map((a) => a.id);

    // Save to localStorage (instant)
    localStorage.setItem(
      `app_order_${user?.id || "guest"}`,
      JSON.stringify(orderIds),
    );

    // Save to backend (background)
    if (user?.id) {
      const { error } = await updateAppOrderAction(user.id, orderIds);
      if (error) {
        console.error("Backend update failed:", error);
      }
    }
  };

  // Remove app from home
  const removeApp = (appId: string) => {
    const updatedApps = apps.filter((app) => app.id !== appId);
    setApps(updatedApps);
    saveOrder(updatedApps);
    toast.success(t("removedToast"));
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: isEditMode ? 100 : 500,
        tolerance: isEditMode ? 8 : 30,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (!isEditMode) setIsEditMode(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setApps((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveOrder(newItems);
        return newItems;
      });
    }
  };

  if (!isLoaded || isAppsLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkle size={16} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
        </main>
        {/* <AppBar activePage={ActivePage.HUB} /> */}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#FAF9F7] selection:bg-indigo-100 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 w-full overflow-y-auto">
        <div className="max-w-lg mx-auto w-full px-6 pb-28 pt-10">
        {/* Header / Edit Mode Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t("myApps")}
          </h1>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
              isEditMode
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-gray-600 border border-gray-100 shadow-sm"
            }`}
          >
            {isEditMode ? (
              <>
                <Check size={18} weight="bold" />
                {t("done")}
              </>
            ) : (
              <>
                <ArrowsOutCardinal size={18} weight="bold" />
                {t("edit")}
              </>
            )}
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="mb-12">
            <div className="grid grid-cols-4 gap-y-8 gap-x-4">
              {user && isAdmin && !isAdminLoading && (
                <>
                  <DashboardWidget
                    title={t("dashboardWidgetTitle")}
                    onOpen={() => router.push("/dashboard")}
                    dimmed={isEditMode}
                  />
                  <AdminWidget
                    title={t("adminWidgetTitle")}
                    onOpen={() => router.push("/admin")}
                    dimmed={isEditMode}
                  />
                </>
              )}
              <SortableContext
                items={apps.map((a) => a.id)}
                strategy={rectSortingStrategy}
              >
                {apps.map((app) => (
                  <SortableAppIcon
                    key={app.id}
                    app={app}
                    isEditMode={isEditMode}
                    isActive={activeId === app.id}
                    onRemove={removeApp}
                  />
                ))}
              </SortableContext>
            </div>
          </section>
        </DndContext>

        {/* Empty State */}
        {!isAppsLoading && apps.length === 0 && (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-xl shadow-indigo-100/20 px-8">
            <div className="bg-indigo-600/10 w-16 h-16 rounded-[1rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Sparkle size={32} weight="fill" className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              {t("buildYourOs")}
            </h3>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-8">
              {t("homeEmptyDescription")}
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
              {t("startExploring")}
            </button>
          </div>
        )}
        </div>
      </main>

      {/* <AppBar activePage={ActivePage.HUB} /> */}
    </div>
  );
}

/**
 * Fixed 2×1 OS widget — spans two columns, one row height.
 */
function DashboardWidget({
  title,
  onOpen,
  dimmed,
}: {
  title: string;
  onOpen: () => void;
  dimmed: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 select-none relative ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative flex flex-col items-center group cursor-pointer active:scale-95 transition-all duration-200"
      >
        <div className="relative">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] flex items-center justify-center relative overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-red-300/50"
            style={{
              background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)",
              boxShadow: "0 8px 24px -6px #EF444440",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            <div className="absolute inset-0 border border-white/20 rounded-[1.25rem]" />

            <Storefront size={32} weight="fill" color="white" className="relative z-10" />
          </div>

          {/* Official badge icon outside the overflow-hidden squircle, positioned beautifully */}
          <div className="absolute bottom-0 right-0 bg-[#F97316] text-white w-5 h-5 rounded-full flex items-center justify-center z-20 border-2 border-[#FAF9F7] dark:border-[var(--card-background)] shadow-md translate-x-1 translate-y-1">
            <Diamond size={10} weight="fill" color="white" />
          </div>
        </div>

        <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 text-center line-clamp-2 w-full tracking-tight px-1 group-hover:text-indigo-600 transition-colors leading-[1.2] mt-2 flex flex-col items-center gap-0.5">
          {title}
        </span>
      </button>
    </div>
  );
}

/**
 * Admin Panel widget — only for admins.
 */
function AdminWidget({
  title,
  onOpen,
  dimmed,
}: {
  title: string;
  onOpen: () => void;
  dimmed: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 select-none relative ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative flex flex-col items-center group cursor-pointer active:scale-95 transition-all duration-200"
      >
        <div className="relative">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] flex items-center justify-center relative overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-300/50"
            style={{
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              boxShadow: "0 8px 24px -6px #4F46E540",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            <div className="absolute inset-0 border border-white/20 rounded-[1.25rem]" />

            <ShieldCheck size={32} weight="fill" color="white" className="relative z-10" />
          </div>

          <div className="absolute bottom-0 right-0 bg-[#7C3AED] text-white w-5 h-5 rounded-full flex items-center justify-center z-20 border-2 border-[#FAF9F7] shadow-md translate-x-1 translate-y-1">
            <SquaresFour size={10} weight="fill" color="white" />
          </div>
        </div>

        <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 text-center line-clamp-2 w-full tracking-tight px-1 group-hover:text-indigo-600 transition-colors leading-[1.2] mt-2 flex flex-col items-center gap-0.5">
          {title}
        </span>
      </button>
    </div>
  );
}

/**
 * Sortable App Icon Component with Long Press and Remove Actions
 */
function SortableAppIcon({
  app,
  isEditMode,
  isActive,
  onRemove,
}: {
  app: MiniApp;
  isEditMode: boolean;
  isActive: boolean;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const Icon = app.icon;

  // Wiggle animation for edit mode
  const wiggleVariants: any = {
    wiggle: {
      rotate: [0, -1.2, 1.2, -1.2, 1.2, 0],
      transition: {
        duration: 0.28,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    idle: {
      rotate: 0,
    },
  };

  const tApps = useTranslations("apps");
  const appName = tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col items-center gap-2 select-none relative ${isEditMode ? "touch-none" : "touch-manipulation"} ${isDragging ? "pointer-events-none" : ""}`}
    >
      {/* Remove Button in Edit Mode */}
      {isEditMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(app.id);
          }}
          className="absolute top-0 right-0 sm:right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md z-30 transition-transform active:scale-90 cursor-pointer pointer-events-auto"
          aria-label={`Remove ${appName}`}
        >
          <span className="text-[14px] leading-[0] font-black">×</span>
        </button>
      )}

      <motion.button
        variants={wiggleVariants}
        animate={isEditMode && !isDragging ? "wiggle" : "idle"}
        onClick={() => {
          if (!isEditMode) {
            navigateToMiniApp(app, router);
          }
        }}
        {...(isEditMode ? attributes : {})}
        {...(isEditMode ? listeners : {})}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex flex-col items-center group cursor-pointer active:scale-95 transition-all duration-200"
      >
        {/* OS Icon Container - Squircle */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 ${
            !isEditMode &&
            "group-hover:scale-105 group-hover:shadow-indigo-200/50"
          }`}
          style={{
            backgroundColor: app.color,
            boxShadow: `0 8px 24px -6px ${app.color}40`,
          }}
        >
          {/* Depth Gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent"></div>
          {/* Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
          {/* Inner Border */}
          <div className="absolute inset-0 border border-white/20 rounded-[1.25rem]"></div>

          <Icon
            size={32}
            weight="fill"
            color="white"
            className="relative z-10 transition-transform duration-300"
          />
        </div>

        {/* App Label */}
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 text-center line-clamp-2 w-full tracking-tight px-1 group-hover:text-indigo-600 transition-colors leading-[1.2] mt-2 flex flex-col items-center gap-0.5">
          {appName}
        </span>
      </motion.button>
    </div>
  );
}
