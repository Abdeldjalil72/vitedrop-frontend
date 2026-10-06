"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricGrid, AdminMetricCard } from "@/components/admin/admin-metric-grid";
import { formatDZD } from "@/lib/formatters";
import {
  Users,
  Search,
  Shield,
  Briefcase,
  Headphones,
  UserCheck,
  UserX,
  Wallet,
  Phone,
  Mail,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  apiGetAdminUsers,
  apiUpdateUserStatus,
  apiUpdateUserRole,
  getCurrentUser,
  AdminUser,
} from "@/lib/api-client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUser = useMemo(() => getCurrentUser(), []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmUser) return;
    const newStatus = !statusConfirmUser.isActive;
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await apiUpdateUserStatus(statusConfirmUser.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === statusConfirmUser.id ? { ...u, isActive: newStatus } : u))
      );
      setActionMessage(
        newStatus ? "Compte réactivé avec succès" : "Compte suspendu"
      );
      setTimeout(() => setActionMessage(null), 3500);
      setStatusConfirmUser(null);
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editingUser || !selectedRole) return;
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await apiUpdateUserRole(editingUser.id, selectedRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, role: selectedRole as any } : u
        )
      );
      setEditingUser(null);
      setActionMessage("Rôle mis à jour avec succès (Session invalidée)");
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors du changement de rôle.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        (u.fullName &&
          u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone && u.phone.includes(searchTerm));

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "SUSPENDED" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const affiliates = users.filter((u) => u.role === "AFFILIATE").length;
    const suppliers = users.filter((u) => u.role === "SUPPLIER").length;
    const suspended = users.filter((u) => !u.isActive).length;
    return { total, affiliates, suppliers, suspended };
  }, [users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            Admin
          </span>
        );
      case "SUPPLIER":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
            Fournisseur
          </span>
        );
      case "CALL_CENTER_AGENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <Headphones className="w-3.5 h-3.5 text-amber-600" />
            Agent Call Center
          </span>
        );
      case "AFFILIATE":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            Media Buyer
          </span>
        );
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isAr = lang === "ar";

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              badge={isAr ? "إدارة المنظومة" : "Administration & RBAC"}
              badgeVariant="rose"
              title={isAr ? "إدارة المستخدمين" : "Gestion des Utilisateurs"}
              description={
                isAr
                  ? "التحكم في حسابات المسوقين، الموردين، وإدارة الصلاحيات وحالات الحسابات."
                  : "Supervisez tous les comptes du réseau, contrôlez les soldes et gérez les statuts d'accès."
              }
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadUsers}
                  disabled={isLoading}
                  className="min-h-[40px] sm:min-h-0 gap-2 text-xs flex items-center justify-center w-full sm:w-auto"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span>{isAr ? "تحديث" : "Actualiser"}</span>
                </Button>
              }
            />

            {/* Notification alert */}
            {actionMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* KPI Summary Cards */}
            <AdminMetricGrid columns={4}>
              <AdminMetricCard
                label={isAr ? "إجمالي المستخدمين" : "Total Utilisateurs"}
                value={stats.total}
                icon={Users}
                variant="default"
              />
              <AdminMetricCard
                label={isAr ? "المسوقون (Affiliates)" : "Affiliés Actifs"}
                value={stats.affiliates}
                icon={Users}
                variant="sky"
              />
              <AdminMetricCard
                label={isAr ? "الموردون (Suppliers)" : "Fournisseurs"}
                value={stats.suppliers}
                icon={Briefcase}
                variant="purple"
              />
              <AdminMetricCard
                label={isAr ? "حسابات معطلة" : "Comptes Suspendus"}
                value={stats.suspended}
                icon={UserX}
                variant={stats.suspended > 0 ? "rose" : "default"}
              />
            </AdminMetricGrid>

            {/* Filter and Search Bar */}
            <div className="p-3.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-black/[0.08] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder={
                    isAr
                      ? "البحث بالاسم، البريد أو الهاتف..."
                      : "Rechercher par nom, email ou téléphone..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-[40px] pl-9 text-xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Role Tabs */}
                <div className="inline-flex p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold overflow-x-auto max-w-full">
                  {[
                    { id: "ALL", label: isAr ? "الكل" : "Tous" },
                    { id: "AFFILIATE", label: isAr ? "مسوقين" : "Affiliés" },
                    { id: "SUPPLIER", label: isAr ? "موردين" : "Fournisseurs" },
                    { id: "ADMIN", label: isAr ? "إدارة" : "Admins" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRoleFilter(tab.id)}
                      className={`min-h-[32px] px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        roleFilter === tab.id
                          ? "bg-white text-black shadow-xs font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Status Toggle */}
                <div className="inline-flex p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold">
                  {[
                    { id: "ALL", label: isAr ? "كل الحالات" : "Tous Statuts" },
                    { id: "ACTIVE", label: isAr ? "نشط" : "Actifs" },
                    { id: "SUSPENDED", label: isAr ? "معلق" : "Suspendus" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === st.id
                          ? "bg-white text-black shadow-xs font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List / Table Container */}
            <Card className="p-0 overflow-hidden border border-black/[0.08] shadow-xs">
              {/* Mobile View: Cards */}
              <div className="block sm:hidden divide-y divide-neutral-100">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500">
                    <span className="text-sm font-medium">
                      {isAr
                        ? "لا توجد نتائج مطابقة لبحثك"
                        : "Aucun utilisateur trouvé avec ces critères"}
                    </span>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="p-3.5 space-y-3">
                      {/* Identity & Role */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-100 to-neutral-200/80 border border-black/[0.06] flex items-center justify-center font-bold text-xs text-neutral-800 shrink-0 select-none shadow-2xs">
                            {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-neutral-950 truncate">
                              {user.fullName || (isAr ? "بدون اسم" : "Non spécifié")}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">{getRoleBadge(user.role)}</div>
                      </div>

                      {/* Details: Balance, Status, Phone */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block font-sans">
                            {isAr ? "الرصيد" : "Solde"}
                          </span>
                          <span className="font-mono font-bold text-neutral-900">
                            {formatDZD(user.balance, lang)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block font-sans">
                            {isAr ? "الحالة" : "Statut"}
                          </span>
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {isAr ? "نشط" : "Actif"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {isAr ? "معلق" : "Suspendu"}
                            </span>
                          )}
                        </div>
                        {user.phone && (
                          <div className="col-span-2 pt-1 border-t border-neutral-200/60 flex items-center gap-1.5 text-[11px] font-mono text-neutral-700">
                            <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={currentUser?.sub === user.id}
                          onClick={() => {
                            setEditingUser(user);
                            setSelectedRole(user.role);
                          }}
                          className="min-h-[40px] text-xs font-medium flex items-center justify-center gap-1.5 w-full"
                          title={
                            currentUser?.sub === user.id
                              ? "Auto-modification désactivée"
                              : "Modifier rôle"
                          }
                        >
                          <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{isAr ? "الصلاحية" : "Rôle"}</span>
                        </Button>

                        {user.isActive ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={currentUser?.sub === user.id}
                            onClick={() => setStatusConfirmUser(user)}
                            className="min-h-[40px] text-xs font-medium flex items-center justify-center gap-1.5 w-full"
                            title={
                              currentUser?.sub === user.id
                                ? "Auto-suspension impossible"
                                : "Suspendre"
                            }
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>{isAr ? "تعليق" : "Suspendre"}</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setStatusConfirmUser(user)}
                            className="min-h-[40px] text-xs font-medium flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isAr ? "تفعيل" : "Activer"}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fbfbfb]">
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "المستخدم" : "Utilisateur"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الدور" : "Rôle"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الهاتف" : "Contact"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الرصيد" : "Solde Portefeuille"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الحالة" : "Statut"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "تاريخ التسجيل" : "Date Inscription"}</TableHead>
                      <TableHead className="py-4 text-end text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
                        {isAr ? "الإجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-36 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                            <span className="text-sm font-medium">{isAr ? "جاري التحميل..." : "Chargement des utilisateurs..."}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-36 text-center text-neutral-500"
                        >
                          <span className="text-sm font-medium">
                            {isAr
                              ? "لا توجد نتائج مطابقة لبحثك"
                              : "Aucun utilisateur trouvé avec ces critères"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* Name, Avatar, and Email */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-100 to-neutral-200/80 border border-black/[0.06] flex items-center justify-center font-bold text-xs text-neutral-800 shrink-0 select-none shadow-2xs">
                                {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-neutral-950 tracking-tight leading-snug truncate">
                                  {user.fullName || (isAr ? "بدون اسم" : "Non spécifié")}
                                </span>
                                <span className="text-xs text-[#6b6b6b] flex items-center gap-1.5 font-normal truncate mt-0.5">
                                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                  <span>{user.email}</span>
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono tracking-wider mt-0.5">
                                  ID: {user.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role */}
                          <TableCell className="py-4">{getRoleBadge(user.role)}</TableCell>

                          {/* Phone */}
                          <TableCell className="py-4">
                            {user.phone ? (
                              <span className="text-xs font-mono font-medium text-neutral-800 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                {user.phone}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                —
                              </span>
                            )}
                          </TableCell>

                          {/* Balance */}
                          <TableCell className="py-4">
                            <span className="font-mono text-sm font-bold text-neutral-900 tracking-tight">
                              {formatDZD(user.balance, lang)}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-4">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {isAr ? "نشط" : "Actif"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {isAr ? "معلق" : "Suspendu"}
                              </span>
                            )}
                          </TableCell>

                          {/* Created At */}
                          <TableCell className="py-4 text-xs text-[#6b6b6b] font-mono font-medium">
                            {new Date(user.createdAt).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-FR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-4 text-end">
                            <div className="flex items-center justify-end gap-2">
                              {/* Change Role Button */}
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={currentUser?.sub === user.id}
                                onClick={() => {
                                  setEditingUser(user);
                                  setSelectedRole(user.role);
                                }}
                                className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5"
                                title={
                                  currentUser?.sub === user.id
                                    ? "Auto-modification désactivée"
                                    : "Modifier rôle"
                                }
                              >
                                <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                                <span>{isAr ? "الصلاحية" : "Rôle"}</span>
                              </Button>

                              {/* Suspend / Reactivate */}
                              {user.isActive ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  disabled={currentUser?.sub === user.id}
                                  onClick={() => setStatusConfirmUser(user)}
                                  className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5"
                                  title={
                                    currentUser?.sub === user.id
                                      ? "Auto-suspension impossible"
                                      : "Suspendre"
                                  }
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>{isAr ? "تعليق" : "Suspendre"}</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setStatusConfirmUser(user)}
                                  className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{isAr ? "تفعيل" : "Activer"}</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="text-xs text-rose-800">
                  {isAr ? "إغلاق" : "Fermer"}
                </Button>
              </div>
            )}

            {/* Status Confirmation Modal */}
            <Modal
              isOpen={!!statusConfirmUser}
              onClose={() => setStatusConfirmUser(null)}
              title={
                statusConfirmUser?.isActive
                  ? isAr ? "تأكيد تعليق الحساب" : "Confirmer la suspension"
                  : isAr ? "تأكيد تفعيل الحساب" : "Confirmer la réactivation"
              }
              maxWidth="sm"
            >
              <div className="space-y-4 pt-2 text-start">
                <p className="text-xs text-neutral-600">
                  {statusConfirmUser?.isActive
                    ? isAr
                      ? `هل أنت متأكد من تعليق حساب "${statusConfirmUser?.fullName || statusConfirmUser?.email}"؟ سيتم إبطال جلسته فوراً.`
                      : `Voulez-vous suspendre l'accès de "${statusConfirmUser?.fullName || statusConfirmUser?.email}" ? Sa session sera immédiatement révoquée.`
                    : isAr
                    ? `هل ترغب في إعادة تفعيل حساب "${statusConfirmUser?.fullName || statusConfirmUser?.email}"؟`
                    : `Voulez-vous réactiver le compte de "${statusConfirmUser?.fullName || statusConfirmUser?.email}" ?`}
                </p>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusConfirmUser(null)}
                    disabled={isUpdating}
                  >
                    {isAr ? "إلغاء" : "Annuler"}
                  </Button>
                  <Button
                    variant={statusConfirmUser?.isActive ? "danger" : "primary"}
                    size="sm"
                    onClick={handleConfirmStatusToggle}
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? "Traitement..."
                      : statusConfirmUser?.isActive
                      ? isAr ? "تعليق الحساب" : "Suspendre"
                      : isAr ? "تفعيل الحساب" : "Réactiver"}
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Modal: Change Role */}
            <Modal
              isOpen={!!editingUser}
              onClose={() => !isUpdating && setEditingUser(null)}
              title="Modifier le Rôle Utilisateur"
              maxWidth="md"
            >
              {editingUser && (
                <div className="space-y-4 pt-2 text-start">
                  <div className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1 border border-neutral-200">
                    <div className="font-semibold text-neutral-900">
                      {editingUser.fullName || "Utilisateur"}
                    </div>
                    <div className="text-neutral-500 font-mono">
                      {editingUser.email}
                    </div>
                    <div className="text-neutral-400 text-[10px] font-mono">
                      ID: {editingUser.id}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-800">
                      Sélectionner le nouveau rôle :
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: "AFFILIATE",
                          label: "Affilié (Media Buyer)",
                          desc: "Accès marketplace, création de liens CPA et retraits.",
                        },
                        {
                          id: "SUPPLIER",
                          label: "Fournisseur (Supplier)",
                          desc: "Publication de catalogue, validation commandes et escrow.",
                        },
                        {
                          id: "CALL_CENTER_AGENT",
                          label: "Agent Call Center",
                          desc: "Confirmation téléphonique des commandes pour son fournisseur.",
                        },
                        {
                          id: "ADMIN",
                          label: "Administrateur Système",
                          desc: "Accès total, gestion escrow et supervision globale.",
                        },
                      ].map((r) => (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRole(r.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedRole === r.id
                              ? "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500/30"
                              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900">
                              {r.label}
                            </span>
                            {selectedRole === r.id && (
                              <CheckCircle2 className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#6b6b6b] mt-0.5">
                            {r.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingUser(null)}
                      disabled={isUpdating}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveRole}
                      disabled={isUpdating || selectedRole === editingUser.role}
                      className="bg-neutral-900 hover:bg-black text-white"
                    >
                      {isUpdating ? "Enregistrement..." : "Appliquer le rôle"}
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
