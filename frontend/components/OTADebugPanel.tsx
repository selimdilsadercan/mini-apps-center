"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  collectOTAStatus,
  getOTALogs,
  OTA_DEBUG_PANEL_ENABLED,
  otaDebugLog,
  parseCapgoBuild,
  subscribeOTADebug,
  type OTAStatusSnapshot,
  type OTALogEntry,
} from "@/lib/ota-debug";

const LEVEL_COLOR: Record<string, string> = {
  info: "text-gray-300",
  warn: "text-amber-400",
  error: "text-red-400",
  rollback: "text-red-500 font-bold",
};

export default function OTADebugPanel() {
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState<OTAStatusSnapshot | null>(null);
  const [logEntries, setLogEntries] = useState<OTALogEntry[]>([]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    otaDebugLog("Debug panel açıldı");

    const refresh = async () => {
      setStatus(await collectOTAStatus());
      setLogEntries(getOTALogs());
    };

    void refresh();
    const unsub = subscribeOTADebug(() => {
      void refresh();
    });
    const interval = window.setInterval(() => void refresh(), 2000);

    return () => {
      unsub();
      window.clearInterval(interval);
    };
  }, []);

  if (!Capacitor.isNativePlatform() || !OTA_DEBUG_PANEL_ENABLED || !status) return null;

  const capgoBuild = parseCapgoBuild(status.bundleVersion);
  const rollbackRisk =
    status.isBuiltin &&
    status.serverLatestBuild !== null &&
    status.serverLatestBuild > status.effectiveBuild;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[500] pointer-events-auto">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`w-full px-3 py-1.5 text-left text-[10px] font-mono border-t ${
          rollbackRisk
            ? "bg-red-950 border-red-500 text-red-200"
            : status.isBuiltin
              ? "bg-amber-950 border-amber-600 text-amber-100"
              : "bg-gray-950 border-gray-700 text-gray-200"
        }`}
      >
        <span className="font-bold">OTA</span>
        {" · "}
        <span className={status.isBuiltin ? "text-amber-400" : "text-emerald-400"}>
          {status.isBuiltin ? "BUILTIN ⚠" : "OTA ✓"}
        </span>
        {" · "}
        bundle={status.bundleId === "builtin" ? "builtin" : `${status.bundleId.slice(0, 8)}…`}
        {" · "}
        b{capgoBuild}
        {" / "}
        eff={status.effectiveBuild}
        {status.serverLatestBuild !== null && (
          <>
            {" · "}
            srv=b{status.serverLatestBuild}
          </>
        )}
        <span className="float-right opacity-60">{expanded ? "▼" : "▲"}</span>
      </button>

      {expanded && (
        <div className="max-h-[45vh] overflow-y-auto bg-gray-950 text-gray-200 px-3 py-2 text-[10px] font-mono border-t border-gray-800 space-y-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <Row label="Platform" value={status.platform} />
            <Row label="Güncellendi" value={status.updatedAt} />
            <Row label="Bundle ID" value={status.bundleId} highlight={status.isBuiltin} />
            <Row label="Bundle ver" value={status.bundleVersion} />
            <Row label="Capgo build" value={capgoBuild} />
            <Row label="Bundle status" value={status.bundleStatus} />
            <Row label="JS config" value={`v${status.configVersion} b${status.configBuild}`} />
            <Row label="Effective build" value={String(status.effectiveBuild)} />
            <Row label="localStorage" value={status.storedBuild ?? "(yok)"} />
            <Row label="Native ver" value={status.nativeVersion} />
            <Row label="Next bundle" value={status.nextBundleId ?? "(yok)"} />
            <Row
              label="Failed bundle"
              value={status.failedBundleId ?? "(yok)"}
              highlight={!!status.failedBundleId}
            />
            <Row label="Sunucu build" value={status.serverLatestBuild?.toString() ?? "?"} />
            <Row
              label="Güncelleme var"
              value={status.serverUpdateAvailable ? "EVET" : "hayır"}
            />
            <Row label="ota_reloaded" value={status.hadOtaReload ? "true" : "false"} />
          </div>

          <div>
            <p className="text-gray-500 mb-0.5">Yerel bundle&apos;lar:</p>
            <p className="text-gray-400 break-all leading-relaxed">{status.localBundles || "-"}</p>
          </div>

          {rollbackRisk && (
            <p className="text-red-400 font-bold">
              ↩ ROLLBACK: builtin çalışıyor ama sunucuda b{status.serverLatestBuild} var
            </p>
          )}

          <div>
            <p className="text-gray-500 mb-1">Log ({logEntries.length})</p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {logEntries.map((log, i) => (
                <p key={`${log.ts}-${i}`} className={LEVEL_COLOR[log.level] ?? "text-gray-300"}>
                  [{log.ts}] {log.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <p>
      <span className="text-gray-500">{label}: </span>
      <span className={highlight ? "text-amber-400 font-bold" : "text-gray-100"}>{value}</span>
    </p>
  );
}
