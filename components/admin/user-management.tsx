"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { UsersIcon, TrashIcon, EditIcon, CheckCircleIcon, XCircleIcon, PlusIcon } from "@/components/icons/admin-icons";

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

  // --- React Hook Form ---
  const createForm = useForm({ resolver: zodResolver(createAdminSchema) });
  const editForm = useForm({ resolver: zodResolver(userSchema) });

  const { data, isLoading, error } = useQuery({
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

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div></div>;

  const users = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Directory</h2>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700">
          <PlusIcon className="h-4 w-4" /> Create Admin
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                     <select 
                        className="bg-transparent text-sm text-blue-600 dark:text-blue-400 font-bold"
                        value={user.role}
                        onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                        disabled={currentUser?.id === user.id}
                     >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ADMIN">ADMIN</option>
                     </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.id !== user.id && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingUser(user); editForm.reset(user); }} className="p-2 text-slate-400 hover:text-blue-600"><EditIcon className="h-5 w-5" /></button>
                        <button onClick={() => deleteMutation.mutate(user.id)} className="p-2 text-slate-400 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Create Admin</h3>
                <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                    <input {...createForm.register("name")} className="w-full p-3 rounded-xl border dark:bg-slate-800" placeholder="Name" />
                    {createForm.formState.errors.name && <p className="text-red-500 text-xs">{createForm.formState.errors.name.message}</p>}
                    <input {...createForm.register("email")} className="w-full p-3 rounded-xl border dark:bg-slate-800" placeholder="Email" />
                    {createForm.formState.errors.email && <p className="text-red-500 text-xs">{createForm.formState.errors.email.message}</p>}
                    <input type="password" {...createForm.register("password")} className="w-full p-3 rounded-xl border dark:bg-slate-800" placeholder="Password" />
                    {createForm.formState.errors.password && <p className="text-red-500 text-xs">{createForm.formState.errors.password.message}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">Create</button>
                </form>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Edit User</h3>
                <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: editingUser.id, data }))} className="space-y-4">
                    <input {...editForm.register("name")} className="w-full p-3 rounded-xl border dark:bg-slate-800" />
                    <input {...editForm.register("email")} className="w-full p-3 rounded-xl border dark:bg-slate-800" />
                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">Update</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
