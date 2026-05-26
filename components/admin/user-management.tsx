"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TrashIcon, EditIcon, PlusIcon } from "@/components/icons/admin-icons";
import { LogView } from "./log-view";

interface User {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  createdAt: string;
}

const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email address"),
});

const createAdminSchema = userSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingLogs, setViewingLogs] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  const createForm = useForm({ resolver: zodResolver(createAdminSchema) });
  const editForm = useForm({ resolver: zodResolver(userSchema) });

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiFetch<{ users: User[] }>("/admin/users");
      return res.users;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiFetch("/admin/create", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreateModal(false);
      createForm.reset();
    },
    onError: (err: ApiError) => alert(err.message || "Failed to create admin"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
    onError: (err: ApiError) => alert(err.message || "Failed to update user"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => apiFetch(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>;

  const users = data 
    ? data
        .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (b.role === "ADMIN" ? 1 : 0) - (a.role === "ADMIN" ? 1 : 0))
    : [];

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-lg bg-slate-950 px-10 py-2 text-sm text-white border border-white/10 outline-none focus:border-indigo-500 transition-all"
            />
        </div>
        <button 
            onClick={() => setShowCreateModal(true)} 
            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer whitespace-nowrap"
        >
            + Add Admin
        </button>
      </div>

      {/* User List: Card-based on Mobile, List-based on Desktop */}
      <div className="grid grid-cols-1 gap-3">
        {users.map((user) => (
          <div key={user.id} className="group bg-slate-900 border border-white/5 rounded-xl p-4 transition-all hover:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* User Info Section */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0 border border-white/5 group-hover:text-indigo-400 transition-colors">
                    {user.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-white truncate text-sm sm:text-base">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Status & Action Row */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-white/5 pt-4 sm:pt-0 sm:border-none">
                <div className="flex flex-col sm:items-end gap-1">
                    <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${user.role === 'ADMIN' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                        <select 
                            className={`bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${user.role === 'ADMIN' ? 'text-indigo-400' : 'text-emerald-400'}`}
                            value={user.role}
                            onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                            disabled={currentUser?.id === user.id || user.role === 'ADMIN'}
                        >
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase hidden sm:block">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setViewingLogs(user)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Logs">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </button>
                    {currentUser?.id !== user.id && user.role !== 'ADMIN' && (
                        <>
                            <button onClick={() => { setEditingUser(user); editForm.reset(user); }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Edit">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => setDeletingUser(user)} className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer" title="Delete">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                </div>
              </div>

            </div>
          </div>
        ))}
        {users.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-xl">
                <p className="text-slate-500 italic text-sm">No accounts found.</p>
            </div>
        )}
      </div>

      {(showCreateModal || editingUser || viewingLogs || deletingUser) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                {viewingLogs ? (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold text-white">Activity Logs</h3>
                            <p className="text-xs text-slate-400">Reviewing system actions for <span className="text-indigo-400 font-bold">{viewingLogs.name}</span></p>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-hide border border-white/5 rounded-xl bg-slate-950/50 p-4">
                            <LogView userId={viewingLogs.id} />
                        </div>
                        <button onClick={() => setViewingLogs(null)} className="w-full p-4 rounded-xl font-black uppercase tracking-widest text-xs bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer">
                            Close Audit View
                        </button>
                    </div>
                ) : deletingUser ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Delete User</h3>
                        <p className="text-slate-400">Are you sure you want to delete {deletingUser.name}? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingUser(null)} className="flex-1 p-4 rounded-xl font-bold text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                            <button onClick={() => { deleteMutation.mutate(deletingUser.id); setDeletingUser(null); }} className="flex-1 p-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 cursor-pointer">Delete</button>
                        </div>
                    </div>
                ) : (
                    <form 
                        onSubmit={showCreateModal ? createForm.handleSubmit((data) => createMutation.mutate(data)) : editForm.handleSubmit((data) => updateMutation.mutate({ id: editingUser!.id, data }))} 
                        className="space-y-4"
                    >
                        <h3 className="text-xl font-bold text-white">{showCreateModal ? "Create Admin" : "Edit User"}</h3>
                        <input {...(showCreateModal ? createForm.register("name") : editForm.register("name"))} className="w-full p-4 rounded-xl border border-white/5 bg-slate-800 text-white placeholder-slate-500" placeholder="Name" />
                        <input {...(showCreateModal ? createForm.register("email") : editForm.register("email"))} className="w-full p-4 rounded-xl border border-white/5 bg-slate-800 text-white placeholder-slate-500" placeholder="Email" />
                        {showCreateModal && (
                            <input type="password" {...createForm.register("password")} className="w-full p-4 rounded-xl border border-white/5 bg-slate-800 text-white placeholder-slate-500" placeholder="Password" />
                        )}
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => { setShowCreateModal(false); setEditingUser(null); }} className="flex-1 p-4 rounded-xl font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" className="flex-1 p-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer">Save</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
