import { BUSINESS_APPS, MINI_APPS, type MiniApp } from "./apps";

/** Directory & SEO sayfaları için yayınlanmış uygulamalar. */
export function getPublishedApps(): MiniApp[] {
  return [...MINI_APPS, ...BUSINESS_APPS].filter(
    (app) => app.isImplemented && !app.isCancelled,
  );
}

export function getPublishedAppById(appId: string): MiniApp | undefined {
  return getPublishedApps().find((app) => app.id === appId);
}

export function getAppDirectoryPath(appId: string): string {
  return `/directory/${appId}`;
}
