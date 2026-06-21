"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Spinner,
  Copy,
  User,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Hourglass,
  Plus,
  Coins,
  Door,
  House,
  Trophy,
  User as UserIcon
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { penalty_jar } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { useTranslations } from "@/contexts/LanguageContext";
import { PRESET_HABITS } from "../../page";

const client = createBrowserClient();

interface Coin {
  id: number;
  left: number; // percentage
  delay: number; // seconds
}

export default function PenaltyJarLobby() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const lobbyId = params.id as string;
  const t = useTranslations("penaltyJar");

  const getLocalizedRuleName = (rule: { id: string; name: string }) => {
    const preset = PRESET_HABITS.find((p: any) => p.id === rule.id);
    if (preset) {
      return `${preset.icon} ${t(`habits.${preset.id}`)}`;
    }
    return rule.name;
  };

  const getLocalizedInfractionRuleName = (ruleName: string) => {
    const cleanName = ruleName.replace(/^[\s\p{Emoji}\uFE0F]+/u, "").trim();
    if (cleanName === "Argo Kullanmak" || cleanName === "Swearing / Slang") {
      return `🤬 ${t("habits.swear")}`;
    }
    if (cleanName === "Geç Uyumak" || cleanName === "Late Sleep") {
      return `😴 ${t("habits.late_sleep")}`;
    }
    if (cleanName === "Abur Cubur" || cleanName === "Junk Food") {
      return `🍟 ${t("habits.junk_food")}`;
    }
    if (cleanName === "Sosyal Medya" || cleanName === "Social Media") {
      return `📱 ${t("habits.social_media")}`;
    }
    if (cleanName === "Sızlanmak" || cleanName === "Complaining / Whining") {
      return `😢 ${t("habits.swearing")}`;
    }
    if (cleanName === "Az Su İçmek" || cleanName === "Not Enough Water") {
      return `💧 ${t("habits.no_water")}`;
    }
    if (cleanName === "Hazır Gıda" || cleanName === "Fast Food") {
      return `🍕 ${t("habits.fast_food")}`;
    }
    if (cleanName === "Hareketsizlik" || cleanName === "Sedentary Behavior") {
      return `🏋️‍♂️ ${t("habits.no_workout")}`;
    }
    return ruleName;
  };

  // State
  const [lobby, setLobby] = useState<penalty_jar.Lobby | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"odalar" | "skor" | "kavanoz" | "profil">("kavanoz");
  
  // Modal states
  const [showSelfReportModal, setShowSelfReportModal] = useState(false);
  const [showCatchModal, setShowCatchModal] = useState(false);
  
  // Action fields
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Jar Animation states
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const previousOwedRef = useRef<number | null>(null);

  const showToastMsg = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Poll lobby data
  useEffect(() => {
    if (!isLoaded || !user || !lobbyId) return;

    fetchLobbyDetails();
    const interval = setInterval(fetchLobbyDetails, 3000);

    return () => clearInterval(interval);
  }, [isLoaded, user, lobbyId]);

  // Auto-select single option when catch modal opens
  useEffect(() => {
    if (showCatchModal && lobby) {
      const otherMembers = lobby.members.filter((m: any) => m.userId !== user?.id);
      if (otherMembers.length === 1) {
        setSelectedUserId(otherMembers[0].userId);
      }
      const rulesList = Array.isArray(lobby.rules) ? lobby.rules : (typeof lobby.rules === "string" ? JSON.parse(lobby.rules) : []);
      if (rulesList.length === 1) {
        setSelectedRuleId(rulesList[0].id);
      }
    }
  }, [showCatchModal, lobby, user?.id]);

  const fetchLobbyDetails = async () => {
    try {
      const res = await client.penalty_jar.getLobby(lobbyId);
      setLobby(res.lobby);
      
      // Auto-join check
      if (user && res.lobby && !res.lobby.members.some((m: any) => m.userId === user.id)) {
        await client.penalty_jar.joinLobby({ userId: user.id, joinCode: res.lobby.joinCode });
        const updatedRes = await client.penalty_jar.getLobby(lobbyId);
        setLobby(updatedRes.lobby);
        showToastMsg(t("joinedRoomSuccess"), "success");
      }
      
      // Calculate total points lost to trigger animations
      const totalPointsLost = res.lobby.members.reduce((acc: number, m: any) => acc + m.moneyOwed, 0);
      
      if (previousOwedRef.current === null) {
        previousOwedRef.current = totalPointsLost;
        setLoading(false);
        return;
      }

      const prevOwed = previousOwedRef.current;
      
      if (prevOwed !== null && totalPointsLost > prevOwed) {
        // Trigger shaking
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 800);

        // Spawn falling coins/points
        const newCoins = Array.from({ length: 6 }).map((_, i) => ({
          id: Date.now() + i,
          left: Math.random() * 80 + 10, // 10% to 90%
          delay: Math.random() * 0.4,
        }));
        setCoins((c) => [...c, ...newCoins]);
        
        // Clean up coins after animation finishes
        setTimeout(() => {
          setCoins((c) => c.filter((x) => !newCoins.find((nc) => nc.id === x.id)));
        }, 1500);
      }
      
      previousOwedRef.current = totalPointsLost;
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!lobby) return;
    navigator.clipboard.writeText(lobby.joinCode);
    showToastMsg(t("codeCopied"), "success");
  };

  const handleSelfReport = async (rule: penalty_jar.Rule) => {
    if (!user || !lobby) return;
    try {
      setSubmitting(true);
      await client.penalty_jar.reportInfraction({
        lobbyId: lobby.id,
        reportedUserId: user.id,
        ruleName: rule.name,
        penaltyAmount: rule.penalty,
        isSelfReport: true,
      });
      showToastMsg(t("selfReportSuccess"), "success");
      setShowSelfReportModal(false);
      fetchLobbyDetails();
    } catch (err) {
      console.error(err);
      showToastMsg(t("selfReportFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCatchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !lobby || !selectedUserId || !selectedRuleId) return;

    const rulesList = Array.isArray(lobby.rules) ? lobby.rules : (typeof lobby.rules === "string" ? JSON.parse(lobby.rules) : []);
    const rule = rulesList.find((r: any) => r.id === selectedRuleId);
    if (!rule) return;

    try {
      setSubmitting(true);
      await client.penalty_jar.reportInfraction({
        lobbyId: lobby.id,
        reportedUserId: selectedUserId,
        reporterUserId: user.id,
        ruleName: rule.name,
        penaltyAmount: rule.penalty,
        isSelfReport: false,
      });
      showToastMsg(t("reportSuccess"), "success");
      setShowCatchModal(false);
      setSelectedRuleId("");
      setSelectedUserId("");
      fetchLobbyDetails();
    } catch (err) {
      console.error(err);
      showToastMsg(t("reportFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (infractionId: string, approve: boolean) => {
    if (!user) return;
    try {
      await client.penalty_jar.voteInfraction({
        infractionId,
        userId: user.id,
        approve,
      });
      showToastMsg(t("voteRecorded"), "success");
      fetchLobbyDetails();
    } catch (err) {
      console.error(err);
      showToastMsg(t("voteFailed"), "error");
    }
  };

  const handleLeaveLobby = async () => {
    if (!user || !lobby) return;
    if (!confirm(t("leaveLobbyConfirm"))) return;

    try {
      await client.penalty_jar.leaveLobby({
        lobbyId: lobby.id,
        userId: user.id,
      });
      showToastMsg(t("leftLobby"), "success");
      router.push("/apps/penalty-jar");
    } catch (err) {
      console.error(err);
      showToastMsg(t("leaveLobbyFailed"), "error");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen bg-[#FAF9F7] items-center justify-center text-gray-900">
        <Spinner size={32} className="animate-spin text-fuchsia-600" />
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] text-gray-800 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-gray-500 mb-4">{t("lobbyNotFound")}</p>
        <button 
          onClick={() => router.push("/apps/penalty-jar")}
          className="px-6 py-3 bg-white border border-gray-150 rounded-2xl text-xs font-bold text-gray-700 cursor-pointer"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  // Calculate sum totals for points display
  const totalPointsLost = lobby.members.reduce((acc: number, m: any) => acc + m.moneyOwed, 0);

  const rulesList: penalty_jar.Rule[] = Array.isArray(lobby.rules)
    ? lobby.rules
    : (typeof lobby.rules === "string" ? JSON.parse(lobby.rules) : []);

  // Leaderboard sorting (lowest moneyOwed/cleanest to highest moneyOwed)
  const sortedMembers = [...lobby.members].sort((a: any, b: any) => a.moneyOwed - b.moneyOwed);

  // Filter pending votes that user can vote on
  const pendingInfractions = lobby.infractions.filter((inf: any) => {
    if (inf.status !== "pending") return false;
    if (inf.reportedUserId === user?.id) return false;
    const alreadyVoted = inf.votes.some((v: any) => v.userId === user?.id);
    return !alreadyVoted;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 pb-28 font-sans relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[35%] h-[35%] bg-fuchsia-100/30 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] bg-rose-100/20 blur-[100px] rounded-full"></div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-6">
        
        {/* Navigation & Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/apps/penalty-jar")} 
              className="p-2 -ml-2 hover:bg-gray-150 rounded-full transition-colors active:scale-95 cursor-pointer text-gray-700"
            >
              <ArrowLeft size={24} color="#374151" />
            </button>
            <div>
              <h1 className="text-xl font-[1000] text-gray-900 tracking-tight leading-none truncate max-w-[200px]">
                {lobby.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold hover:text-gray-600"
                >
                  Code: <span className="font-bold text-fuchsia-600">{lobby.joinCode}</span>
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLeaveLobby}
            className="p-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all active:scale-95 text-gray-500 cursor-pointer"
            title="Leave Room"
          >
            <Door size={20} />
          </button>
        </header>

        {/* Pending Votes Section */}
        {pendingInfractions.length > 0 && (
          <div className="mb-6 space-y-3">
            {pendingInfractions.map((inf: any) => (
              <div 
                key={inf.id}
                className="bg-amber-50/90 border border-amber-200 rounded-3xl p-5 shadow-sm relative overflow-hidden animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                    <Hourglass size={18} weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-700">{t("liveVoting")}</span>
                    <h4 className="font-bold text-xs text-gray-800 mt-1 leading-relaxed">
                      {t("reportedUsernameText", {
                        reporter: inf.reporterUsername || "Anonim",
                        reported: inf.reportedUsername || "Anonim",
                        rule: getLocalizedInfractionRuleName(inf.ruleName)
                      })}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t("liveVotingDesc")}</p>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleVote(inf.id, true)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-emerald-100"
                      >
                        <CheckCircle size={14} weight="bold" />
                        {t("yes")}
                      </button>
                      <button
                        onClick={() => handleVote(inf.id, false)}
                        className="flex-1 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} weight="bold" />
                        {t("no")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visual Jar Box */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-150 rounded-3xl p-6 mb-6 flex flex-col items-center relative overflow-hidden shadow-sm">
          
          {/* Falling points container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {coins.map((c) => (
              <div
                key={c.id}
                className="falling-coin"
                style={{
                  left: `${c.left}%`,
                  animationDelay: `${c.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Jar Container */}
          <div 
            className={`w-36 h-48 bg-fuchsia-50/30 border-2 border-gray-300 rounded-b-[3.5rem] rounded-t-[1.5rem] flex flex-col justify-end items-center p-3 relative shadow-inner ${
              isShaking ? "jar-shake" : ""
            }`}
          >
            {/* Jar Cap */}
            <div className="absolute top-0 w-20 h-4 bg-gray-400 border border-gray-300 rounded-full -mt-2" />
            
            {/* Jar Neck */}
            <div className="absolute top-2 w-16 h-4 bg-gray-200/50 border-x border-gray-300" />
            
            {/* Liquid / Points Fill visualization */}
            <div 
              className="w-full bg-fuchsia-500/10 border-t border-fuchsia-400/30 rounded-b-[2.8rem] transition-all duration-1000 ease-out flex flex-col items-center justify-center"
              style={{ 
                height: `${Math.min(90, Math.max(15, (totalPointsLost / 200) * 80))}%` 
              }}
            >
              <div className="text-fuchsia-600/70 text-xs font-black animate-pulse">+{totalPointsLost} P</div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-2xl font-[1000] text-gray-900">
              {t("totalPenalty", { points: totalPointsLost })}
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">{t("totalPenaltyDesc")}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => setShowSelfReportModal(true)}
            className="py-4 bg-white hover:bg-fuchsia-50 border border-gray-150 hover:border-fuchsia-200 text-gray-800 rounded-2xl font-black text-xs transition-all active:scale-[0.98] cursor-pointer flex flex-col items-center gap-1 shadow-sm"
          >
            <span className="text-lg">🤦‍♂️</span>
            <span className="text-fuchsia-900">{t("selfReport")}</span>
          </button>
          
          <button
            onClick={() => setShowCatchModal(true)}
            className="py-4 bg-white hover:bg-amber-50 border border-gray-150 hover:border-amber-200 text-gray-800 rounded-2xl font-black text-xs transition-all active:scale-[0.98] cursor-pointer flex flex-col items-center gap-1 shadow-sm"
          >
            <span className="text-lg">📸</span>
            <span className="text-amber-900 font-extrabold">{t("catchSomeone")}</span>
          </button>
        </div>

        {/* Leaderboard / Scoreboard */}
        <section className="mb-6">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 px-1">Ceza Tablosu</h3>
          <div className="bg-white/80 border border-gray-150 rounded-3xl overflow-hidden p-2 space-y-1 shadow-sm">
            {sortedMembers.map((member: any, index: number) => {
              const isCurrentUser = member.userId === user?.id;
              
              let rankEmoji = "👤";
              if (index === 0) rankEmoji = "😇"; // Cleanest
              else if (index === sortedMembers.length - 1 && sortedMembers.length > 1) rankEmoji = "👿"; // Most violations

              return (
                <div 
                  key={member.userId}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                    isCurrentUser 
                      ? "bg-fuchsia-50/60 border-fuchsia-100" 
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                      {member.avatar ? (
                        <img src={member.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-sm">{rankEmoji}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">
                        {member.username || "Anonim"}
                        {isCurrentUser && <span className="text-[9px] text-fuchsia-600 ml-1 font-bold">(Ben)</span>}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900">{t("points", { points: `-${member.moneyOwed}` })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Infraction Log */}
        {lobby.infractions && lobby.infractions.length > 0 && (
          <section>
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 px-1">{t("penaltyHistory")}</h3>
            <div className="space-y-2">
              {lobby.infractions.map((inf: any) => {
                let statusColor = "text-gray-500 bg-gray-100";
                let statusLabel = t("statusPending");
                if (inf.status === "approved") {
                  statusColor = "text-emerald-700 bg-emerald-50 border border-emerald-100";
                  statusLabel = t("statusApproved");
                } else if (inf.status === "rejected") {
                  statusColor = "text-rose-700 bg-rose-50 border border-rose-100";
                  statusLabel = t("statusRejected");
                }

                return (
                  <div key={inf.id} className="bg-white/80 border border-gray-150 rounded-2xl p-4 flex justify-between items-start shadow-sm">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">
                        {inf.reportedUsername || "Biri"} • <span className="text-rose-600">{getLocalizedInfractionRuleName(inf.ruleName)}</span>
                      </h4>
                      <p className="text-[9px] text-gray-400 font-medium mt-1">
                        {inf.isSelfReport ? (
                          <span>💡 {t("selfReportLabel")}</span>
                        ) : (
                          <span>🔍 {t("caughtBy", { reporter: inf.reporterUsername || "Arkadaşı" })}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-black text-rose-600">
                        {t("points", { points: `-${inf.penaltyAmount}` })}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* 1. SELF REPORT MODAL */}
      {showSelfReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-t-[2.5rem] rounded-b-[1.5rem] w-full max-w-md p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-sm text-gray-900">{t("selfReportTitle")}</h3>
              <button 
                onClick={() => setShowSelfReportModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
              >
                {t("goBack")}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              {t("selfReportDesc")}
            </p>

            <div className="space-y-2">
              {rulesList.map((rule: any) => (
                <button
                  key={rule.id}
                  onClick={() => handleSelfReport(rule)}
                  disabled={submitting}
                  className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-150 px-4 py-3 rounded-2xl text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-gray-800 font-bold">{getLocalizedRuleName(rule)}</span>
                  <span className="text-[10px] font-black text-rose-600">
                    {t("points", { points: `-${rule.penalty}` })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CATCH FRIEND MODAL */}
      {showCatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-t-[2.5rem] rounded-b-[1.5rem] w-full max-w-md p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-sm text-gray-900">{t("reportViolation")}</h3>
              <button 
                onClick={() => setShowCatchModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
              >
                {t("goBack")}
              </button>
            </div>

            <form onSubmit={handleCatchUser} className="space-y-4">
              
              <div>
                <label className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider block mb-2">{t("selectFriend")}</label>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {lobby.members.filter((m: any) => m.userId !== user?.id).map((m: any) => {
                    const isSelected = selectedUserId === m.userId;
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => setSelectedUserId(m.userId)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all text-xs font-bold cursor-pointer ${
                          isSelected
                            ? "bg-fuchsia-50 border-fuchsia-500 text-fuchsia-900 shadow-sm"
                            : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          {m.avatar ? (
                            <img src={m.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <span className="truncate flex-1">{m.username || "Anonim"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider block mb-2">{t("selectRule")}</label>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {rulesList.map((rule: any) => {
                    const isSelected = selectedRuleId === rule.id;
                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => setSelectedRuleId(rule.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all text-xs font-bold cursor-pointer ${
                          isSelected
                            ? "bg-fuchsia-50 border-fuchsia-500 text-fuchsia-900 shadow-sm"
                            : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span className="truncate flex-1">{getLocalizedRuleName(rule)}</span>
                        <span className="text-[10px] font-black text-rose-600">
                          {t("points", { points: `-${rule.penalty}` })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedUserId || !selectedRuleId}
                className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer active:scale-[0.98]"
              >
                {submitting ? <Spinner size={16} className="animate-spin mx-auto" /> : t("submitReport")}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modern App Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-150 py-4 px-8 flex justify-between items-center z-40 rounded-t-[2rem] shadow-lg">
        <button 
          onClick={() => router.push("/apps/penalty-jar")}
          className="flex flex-col items-center gap-1 transition-all text-gray-400 hover:text-gray-650"
        >
          <House size={20} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navRooms")}</span>
        </button>

        <button 
          onClick={() => setActiveTab("skor")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "skor" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-650"
          }`}
        >
          <Trophy size={20} weight={activeTab === "skor" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navScore")}</span>
        </button>

        <button 
          onClick={() => setActiveTab("kavanoz")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "kavanoz" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-650"
          }`}
        >
          <Coins size={20} weight={activeTab === "kavanoz" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navJar")}</span>
        </button>

        <button 
          onClick={() => setActiveTab("profil")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "profil" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-650"
          }`}
        >
          <UserIcon size={20} weight={activeTab === "profil" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navProfile")}</span>
        </button>
      </nav>

      {/* Standard CSS animation injects for falling coins */}
      <style dangerouslySetInnerHTML={{ __html: `
        .falling-coin {
          position: absolute;
          width: 16px;
          height: 16px;
          background-color: #d946ef;
          border: 2px solid #f0abfc;
          border-radius: 9999px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          top: -20px;
          animation: fall 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(10px) rotate(45deg) scale(1);
          }
          100% {
            transform: translateY(220px) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }
        .jar-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}} />

    </div>
  );
}
