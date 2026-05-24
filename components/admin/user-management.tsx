"use client";

import { useState, useEffect } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { UsersIcon, TrashIcon, EditIcon, CheckCircleIcon, XCircleIcon, PlusIcon } from "../icons/admin-icons";

interface User {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  createdAt: string;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await apiFetch<{ users: User[] }>("/admin/users");
      setUsers(data.users);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Failed to load users. Please make sure you have admin privileges.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await apiFetch("/admin/create", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
        }),
      });
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      await fetchUsers();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.message || "Failed to create admin");
    } finally {
      setCreateLoading(false);
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdateLoading(true);
      
      // Update Name and Email
      if (editName !== editingUser.name || editEmail !== editingUser.email) {
        await apiFetch(`/admin/users/${editingUser.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: editName, email: editEmail }),
        });
      }

      // Update Role if changed
      if (editRole !== editingUser.role) {
        await apiFetch(`/admin/users/${editingUser.id}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: editRole }),
        });
      }

      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.message || "Failed to update user");
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handleDeleteUser(userId: number, name: string) {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await apiFetch(`/admin/users/${userId}`, {
        method: "DELETE",
      });
      // Refresh user list
      await fetchUsers();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-8 text-center border border-red-100">
        <p className="font-medium text-red-600">{error}</p>
        <button 
          onClick={fetchUsers}
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Directory</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all registered users and their permissions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold dark:bg-blue-900/20 dark:text-blue-400">
            {users.length} Total Users
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Admin</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Joined</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 text-sm font-bold text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      user.role === "ADMIN" 
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                        : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.id !== user.id && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
                          title="Edit User"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                          title="Delete User"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-3xl border border-white bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Admin</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 dark:text-slate-500">Full Name</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 dark:text-slate-500">Email Address</label>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 dark:text-slate-500">Password</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-3xl border border-white bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit User</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 dark:text-slate-500">Full Name</label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 dark:text-slate-500">Email Address</label>
                <input
                  required
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 dark:text-slate-500">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "STUDENT" | "ADMIN")}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateLoading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
