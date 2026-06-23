"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MagnifyingGlass, ShieldCheck, User as UserIcon, Calendar, DotsThreeVertical, Trash, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { admin } from "@/lib/client";
import { toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<admin.AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const client = createBrowserClient();
      const response = await client.admin.listUsers({
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE
      });
      setUsers(response.users);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="max-w-5xl mx-auto px-6 pt-12 pb-24">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Users size={24} weight="fill" color="white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Kullanıcılar
            </h1>
          </div>
          <p className="text-gray-500 font-medium">
            Sistemdeki toplam {totalCount} kullanıcıyı yönetin.
          </p>
        </div>

        <div className="relative group">
          <MagnifyingGlass 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-indigo-500 transition-colors" 
            size={20} 
            weight="bold" 
          />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-white border border-stone-200/60 pl-12 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </motion.header>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/50 animate-pulse rounded-[2rem] border border-stone-100" />
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-stone-100 p-5 rounded-[2rem] flex items-center justify-between group hover:shadow-xl hover:shadow-stone-200/40 hover:border-indigo-100 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.username || ""} 
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100 shadow-inner">
                            <UserIcon size={28} weight="duotone" />
                          </div>
                        )}
                        {user.role === "admin" && (
                          <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-lg shadow-lg shadow-indigo-200 ring-2 ring-white">
                            <ShieldCheck size={12} weight="fill" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-black text-stone-900 truncate">
                            {user.full_name || user.username || "İsimsiz Kullanıcı"}
                          </h3>
                          {user.role === "admin" && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-400 font-bold">
                          <span className="flex items-center gap-1">
                            @{user.username || "kullanici"}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-stone-200" />
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(user.created_at).toLocaleDateString("tr-TR", { 
                              day: "numeric", 
                              month: "long", 
                              year: "numeric" 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors">
                        <DotsThreeVertical size={20} weight="bold" />
                      </button>
                      <button className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash size={20} weight="bold" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first, last, and pages around current
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                              : "text-stone-400 hover:bg-stone-50 hover:text-stone-900"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 || 
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-stone-300 px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <CaretRight size={20} weight="bold" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white/40 rounded-[2.5rem] border border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 mx-auto mb-4 border border-stone-100">
              <Users size={32} weight="duotone" />
            </div>
            <h3 className="text-stone-900 font-bold mb-1">Kullanıcı Bulunamadı</h3>
            <p className="text-stone-500 text-sm font-medium">Arama kriterlerinize uygun kullanıcı bulunmuyor.</p>
          </div>
        )}
      </div>
    </main>
  );
}
