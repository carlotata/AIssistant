"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TrashIcon, EditIcon, PlusIcon, LogsIcon } from "@/components/icons/admin-icons";
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
      mutationFn: (body: any) =>
         apiFetch("/admin/create", {
            method: "POST",
            body: JSON.stringify(body),
         }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["users"] });
         setShowCreateModal(false);
         createForm.reset();
      },
      onError: (err: ApiError) =>
         alert(err.message || "Failed to create admin"),
   });

   const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: number; data: any }) =>
         apiFetch(`/admin/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
         }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["users"] });
         setEditingUser(null);
      },
      onError: (err: ApiError) => alert(err.message || "Failed to update user"),
   });

   const roleMutation = useMutation({
      mutationFn: ({ id, role }: { id: number; role: string }) =>
         apiFetch(`/admin/users/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
         }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
   });

   const deleteMutation = useMutation({
      mutationFn: (id: number) =>
         apiFetch(`/admin/users/${id}`, { method: "DELETE" }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
   });

   if (isLoading)
      return (
         <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
         </div>
      );

   const users = data
      ? data
           .filter(
              (u) =>
                 u.name.toLowerCase().includes(search.toLowerCase()) ||
                 u.email.toLowerCase().includes(search.toLowerCase()),
           )
           .sort(
              (a, b) =>
                 (b.role === "ADMIN" ? 1 : 0) - (a.role === "ADMIN" ? 1 : 0),
           )
      : [];

   return (
      <div className="space-y-4">
         {/* Simple Search and Action Bar */}
         <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
               <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
               <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full rounded-lg bg-slate-900 px-10 py-2 text-sm text-white border border-white/10 outline-none focus:border-indigo-500 transition-all"
               />
            </div>
            <button
               onClick={() => setShowCreateModal(true)}
               className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap">
               <PlusIcon className="h-4 w-4" />
               Add Admin
            </button>
         </div>

         {/* User List */}
         <div className="space-y-2">
            {users.length > 0 ? (
               users.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const isAdmin = user.role === "ADMIN";
                  const disableActions = isSelf || isAdmin;

                  return (
                     <div
                        key={user.id}
                        className="rounded-xl border border-white/5 bg-slate-900/50 p-4 transition-colors hover:bg-slate-900">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                           {/* User Info */}
                           <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-300">
                                 {user.name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <h3 className="truncate text-sm font-bold text-white">
                                       {user.name}
                                    </h3>
                                    {isSelf && (
                                       <span className="text-[10px] text-indigo-400 font-bold uppercase">You</span>
                                    )}
                                 </div>
                                 <p className="truncate text-xs text-slate-500">{user.email}</p>
                              </div>
                           </div>

                           {/* Role & Actions */}
                           <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                              <select
                                 value={user.role}
                                 onChange={(e) =>
                                    roleMutation.mutate({
                                       id: user.id,
                                       role: e.target.value,
                                    })
                                 }
                                 disabled={isSelf}
                                 className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 outline-none hover:border-white/20 transition-all disabled:opacity-50">
                                 <option value="STUDENT">Student</option>
                                 <option value="ADMIN">Admin</option>
                              </select>

                              <div className="flex items-center gap-1 sm:gap-2">
                                 <button
                                    onClick={() => setViewingLogs(user)}
                                    className="inline-flex items-center gap-2 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all sm:px-3 sm:py-1.5"
                                    title="Logs">
                                    <LogsIcon className="h-4 w-4" />
                                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Logs</span>
                                 </button>

                                 <button
                                    disabled={disableActions}
                                    onClick={() => {
                                       setEditingUser(user);
                                       editForm.reset(user);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all disabled:opacity-20 disabled:hover:bg-transparent sm:px-3 sm:py-1.5"
                                    title="Edit">
                                    <EditIcon className="h-4 w-4" />
                                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Edit</span>
                                 </button>

                                 <button
                                    disabled={disableActions}
                                    onClick={() => setDeletingUser(user)}
                                    className="inline-flex items-center gap-2 rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20 disabled:hover:bg-transparent sm:px-3 sm:py-1.5"
                                    title="Delete">
                                    <TrashIcon className="h-4 w-4" />
                                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Delete</span>
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })
            ) : (
               <div className="py-12 text-center text-slate-500 text-sm">No users found matching your search.</div>
            )}
         </div>

         {/* Modals */}
         {(showCreateModal || editingUser || viewingLogs || deletingUser) && (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
               <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
                  {viewingLogs ? (
                     <div className="flex flex-col max-h-[85vh]">
                        <div className="border-b border-white/5 p-4">
                           <h3 className="text-sm font-bold text-white">Activity Audit: {viewingLogs.name}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                           <LogView userId={viewingLogs.id} />
                        </div>
                        <div className="p-4 border-t border-white/5">
                           <button
                              onClick={() => setViewingLogs(null)}
                              className="w-full rounded-lg bg-slate-800 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                              Close
                           </button>
                        </div>
                     </div>
                  ) : deletingUser ? (
                     <div className="p-6 space-y-4 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-red-400">
                           <TrashIcon className="h-6 w-6" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-white">Delete User?</h3>
                           <p className="mt-1 text-sm text-slate-400">This will permanently remove {deletingUser.name}.</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button
                              onClick={() => setDeletingUser(null)}
                              className="flex-1 rounded-lg border border-white/10 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">
                              Cancel
                           </button>
                           <button
                              onClick={() => {
                                 deleteMutation.mutate(deletingUser.id);
                                 setDeletingUser(null);
                              }}
                              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors">
                              Delete
                           </button>
                        </div>
                     </div>
                  ) : (
                     <form
                        onSubmit={
                           showCreateModal
                              ? createForm.handleSubmit((data) => createMutation.mutate(data))
                              : editForm.handleSubmit((data) => updateMutation.mutate({ id: editingUser!.id, data }))
                        }
                        className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white">
                           {showCreateModal ? "New Admin" : "Edit User"}
                        </h3>
                        <div className="space-y-3">
                           <input
                              {...(showCreateModal ? createForm.register("name") : editForm.register("name"))}
                              className="w-full rounded-lg border border-white/10 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                              placeholder="Full Name"
                           />
                           <input
                              {...(showCreateModal ? createForm.register("email") : editForm.register("email"))}
                              className="w-full rounded-lg border border-white/10 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                              placeholder="Email Address"
                           />
                           {showCreateModal && (
                              <input
                                 type="password"
                                 {...createForm.register("password")}
                                 className="w-full rounded-lg border border-white/10 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                                 placeholder="Password"
                              />
                           )}
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button
                              type="button"
                              onClick={() => {
                                 setShowCreateModal(false);
                                 setEditingUser(null);
                              }}
                              className="flex-1 rounded-lg border border-white/10 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">
                              Cancel
                           </button>
                           <button
                              type="submit"
                              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                              Save
                           </button>
                        </div>
                     </form>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
