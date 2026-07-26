export interface IconExportTarget {
  path: string;
  size: number;
  /** iOS App Store marketing icon — export without alpha */
  opaque?: boolean;
}

/** iOS AppIcon.appiconset — projedeki dosya adları ve piksel boyutları */
export const IOS_ICON_TARGETS: IconExportTarget[] = [
  { path: "ios/16.png", size: 16 },
  { path: "ios/20.png", size: 20 },
  { path: "ios/29.png", size: 29 },
  { path: "ios/32.png", size: 32 },
  { path: "ios/40.png", size: 40 },
  { path: "ios/48.png", size: 48 },
  { path: "ios/50.png", size: 50 },
  { path: "ios/55.png", size: 55 },
  { path: "ios/57.png", size: 57 },
  { path: "ios/58.png", size: 58 },
  { path: "ios/60.png", size: 60 },
  { path: "ios/64.png", size: 64 },
  { path: "ios/66.png", size: 66 },
  { path: "ios/72.png", size: 72 },
  { path: "ios/76.png", size: 76 },
  { path: "ios/80.png", size: 80 },
  { path: "ios/87.png", size: 87 },
  { path: "ios/88.png", size: 88 },
  { path: "ios/92.png", size: 92 },
  { path: "ios/100.png", size: 100 },
  { path: "ios/102.png", size: 102 },
  { path: "ios/108.png", size: 108 },
  { path: "ios/114.png", size: 114 },
  { path: "ios/120.png", size: 120 },
  { path: "ios/128.png", size: 128 },
  { path: "ios/144.png", size: 144 },
  { path: "ios/152.png", size: 152 },
  { path: "ios/167.png", size: 167 },
  { path: "ios/172.png", size: 172 },
  { path: "ios/180.png", size: 180 },
  { path: "ios/196.png", size: 196 },
  { path: "ios/216.png", size: 216 },
  { path: "ios/234.png", size: 234 },
  { path: "ios/256.png", size: 256 },
  { path: "ios/258.png", size: 258 },
  { path: "ios/512.png", size: 512 },
  { path: "ios/1024.png", size: 1024, opaque: true },
];

/** Android mipmap + Play Store — projedeki launcher boyutları */
export const ANDROID_ICON_TARGETS: IconExportTarget[] = [
  { path: "android/mipmap-ldpi/ic_launcher.png", size: 36 },
  { path: "android/mipmap-mdpi/ic_launcher.png", size: 48 },
  { path: "android/mipmap-hdpi/ic_launcher.png", size: 72 },
  { path: "android/mipmap-xhdpi/ic_launcher.png", size: 96 },
  { path: "android/mipmap-xxhdpi/ic_launcher.png", size: 144 },
  { path: "android/mipmap-xxxhdpi/ic_launcher.png", size: 192 },
  { path: "android/play-store-icon-512.png", size: 512 },
];

/** Web / PWA — frontend/public dosya adları */
export const WEB_ICON_TARGETS: IconExportTarget[] = [
  { path: "web/favicon-16x16.png", size: 16 },
  { path: "web/favicon-32x32.png", size: 32 },
  { path: "web/apple-touch-icon.png", size: 180 },
  { path: "web/android-chrome-192x192.png", size: 192 },
  { path: "web/android-chrome-512x512.png", size: 512 },
  { path: "web/icon.png", size: 1024 },
];

export const ALL_ICON_TARGETS: IconExportTarget[] = [
  ...IOS_ICON_TARGETS,
  ...ANDROID_ICON_TARGETS,
  ...WEB_ICON_TARGETS,
];

export const ICON_EXPORT_GROUPS = [
  { id: "ios", label: "iOS", count: IOS_ICON_TARGETS.length },
  { id: "android", label: "Android", count: ANDROID_ICON_TARGETS.length },
  { id: "web", label: "Web / PWA", count: WEB_ICON_TARGETS.length },
] as const;
