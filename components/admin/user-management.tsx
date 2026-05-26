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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Users</h2>
        <div className="flex gap-2">
            <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-white border border-white/5 outline-none focus:border-indigo-500"
            />
            <button 
            onClick={() => setShowCreateModal(true)} 
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
            >
            Add Admin
            </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-slate-900">
        <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{user.name}</td>
                  <td className="px-4 py-3 text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                     <div className="relative inline-block">
                        <select 
                            className={`bg-transparent font-semibold outline-none cursor-pointer appearance-none pr-6 ${user.role === 'ADMIN' ? 'text-slate-500' : 'text-indigo-400'}`}
                            value={user.role}
                            onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                            disabled={currentUser?.id === user.id || user.role === 'ADMIN'}
                        >
                            <option value="STUDENT" className="bg-slate-900 text-indigo-400">Student</option>
                            <option value="ADMIN" className="bg-slate-900 text-slate-500">Admin</option>
                        </select>
                        {user.role !== 'ADMIN' && (
                            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        )}
                     </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {currentUser?.id !== user.id && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewingLogs(user)} className="text-indigo-500 hover:text-indigo-400 transition-colors text-xs font-semibold cursor-pointer">Logs</button>
                        {user.role !== 'ADMIN' && (
                            <>
                                <button onClick={() => { setEditingUser(user); editForm.reset(user); }} className="text-slate-500 hover:text-white transition-colors cursor-pointer">Edit</button>
                                <button onClick={() => setDeletingUser(user)} className="text-red-500 hover:text-red-400 transition-colors cursor-pointer">Delete</button>
                            </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {(showCreateModal || editingUser || viewingLogs || deletingUser) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
                {viewingLogs ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Logs for {viewingLogs.name}</h3>
                        <LogView userId={viewingLogs.id} />
                        <button onClick={() => setViewingLogs(null)} className="w-full p-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer">Close</button>
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
