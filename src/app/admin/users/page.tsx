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
import { UserStatusModal } from "@/components/admin/user-status-modal";
import { UserRoleModal } from "@/components/admin/user-role-modal";
import { formatDZD } from "@/lib/formatters";
import {
  Users,
  Search,
  Shield,
  Briefcase,
  Headphones,
  UserCheck,
  UserX,
  Phone,
  Mail,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Wallet,
} from "lucide-react";
import {
  apiGetAdminUsers,
  getCurrentUser,
  AdminUser,
} from "@/lib/api-client";
import { AdminTopUpModal } from "@/components/admin/admin-topup-modal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = useState<AdminUser | null>(null);
  const [topUpSupplier, setTopUpSupplier] = useState<AdminUser | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentUser = useMemo(() => getCurrentUser(), []);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
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

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        (u.fullName &&
          u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone && u.phone.includes(searchTerm)) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase());

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

  const getRoleBadge = (role: string, isAr: boolean, isEn: boolean) => {
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
            {isAr ? "مورد" : isEn ? "Supplier" : "Fournisseur"}
          </span>
        );
      case "CALL_CENTER_AGENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <Headphones className="w-3.5 h-3.5 text-amber-600" />
            {isAr ? "مركز اتصال" : isEn ? "Call Center" : "Call Center"}
          </span>
        );
      case "AFFILIATE":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            {isAr ? "مسوق" : isEn ? "Media Buyer" : "Media Buyer"}
          </span>
        );
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isAr = lang === "ar";
        const isEn = lang === "en";

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              badge={isAr ? "إدارة المنظومة" : isEn ? "Administration & RBAC" : "Administration & RBAC"}
              badgeVariant="rose"
              title={isAr ? "إدارة المستخدمين" : isEn ? "User Management" : "Gestion des Utilisateurs"}
              description={
                isAr
                  ? "التحكم في حسابات المسوقين، الموردين، وإدارة الصلاحيات وحالات الحسابات."
                  : isEn
                  ? "Oversee network accounts, balance ledgers, and access permissions."
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
                  <span>{isAr ? "تحديث" : isEn ? "Refresh" : "Actualiser"}</span>
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
                label={isAr ? "إجمالي المستخدمين" : isEn ? "Total Users" : "Total Utilisateurs"}
                value={stats.total}
                icon={Users}
                variant="default"
              />
              <AdminMetricCard
                label={isAr ? "المسوقون (Affiliates)" : isEn ? "Active Affiliates" : "Affiliés Actifs"}
                value={stats.affiliates}
                icon={Users}
                variant="sky"
              />
              <AdminMetricCard
                label={isAr ? "الموردون (Suppliers)" : isEn ? "Suppliers" : "Fournisseurs"}
                value={stats.suppliers}
                icon={Briefcase}
                variant="purple"
              />
              <AdminMetricCard
                label={isAr ? "حسابات معطلة" : isEn ? "Suspended Accounts" : "Comptes Suspendus"}
                value={stats.suspended}
                icon={UserX}
                variant={stats.suspended > 0 ? "rose" : "default"}
              />
            </AdminMetricGrid>

            {/* Filter and Search Bar */}
            <div className="p-3.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={
                    isAr
                      ? "البحث بالاسم، البريد أو الهاتف..."
                      : isEn
                      ? "Search by name, email, or phone..."
                      : "Rechercher par nom, email ou téléphone..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-[40px] ps-9 pe-3 text-xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Role Tabs */}
                <div className="inline-flex p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold overflow-x-auto max-w-full">
                  {[
                    { id: "ALL", label: isAr ? "الكل" : isEn ? "All" : "Tous" },
                    { id: "AFFILIATE", label: isAr ? "مسوقين" : isEn ? "Affiliates" : "Affiliés" },
                    { id: "SUPPLIER", label: isAr ? "موردين" : isEn ? "Suppliers" : "Fournisseurs" },
                    { id: "ADMIN", label: isAr ? "إدارة" : isEn ? "Admins" : "Admins" },
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
                    { id: "ALL", label: isAr ? "كل الحالات" : isEn ? "All Statuses" : "Tous Statuts" },
                    { id: "ACTIVE", label: isAr ? "نشط" : isEn ? "Active" : "Actifs" },
                    { id: "SUSPENDED", label: isAr ? "معلق" : isEn ? "Suspended" : "Suspendus" },
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
            <Card className="p-0 overflow-hidden border border-[#e7e5df] shadow-xs">
              {/* Mobile & Tablet View: Cards (< 1024px) */}
              <div className="block lg:hidden divide-y divide-neutral-100 md:divide-y-0 md:grid md:grid-cols-2 md:gap-3 md:p-3.5">
                {isLoading ? (
                  <div className="p-6 space-y-3 md:col-span-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500 md:col-span-2">
                    <span className="text-sm font-medium">
                      {isAr
                        ? "لا توجد نتائج مطابقة لبحثك"
                        : isEn
                        ? "No users found matching these criteria"
                        : "Aucun utilisateur trouvé avec ces critères"}
                    </span>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3.5 space-y-3 md:rounded-xl md:border md:border-[#e7e5df]"
                      data-testid="admin-user-card"
                    >
                      {/* Identity & Role */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-100 to-neutral-200/80 border border-black/[0.06] flex items-center justify-center font-bold text-xs text-neutral-800 shrink-0 select-none shadow-2xs">
                            {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-neutral-950 truncate">
                              {user.fullName || (isAr ? "بدون اسم" : isEn ? "Not specified" : "Non spécifié")}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">{getRoleBadge(user.role, isAr, isEn)}</div>
                      </div>

                      {/* Details: Balance, Status, Phone, ID */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block font-sans">
                            {isAr ? "الرصيد" : isEn ? "Balance" : "Solde"}
                          </span>
                          <span className="font-mono font-bold text-neutral-900">
                            {formatDZD(user.balance, lang)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block font-sans">
                            {isAr ? "الحالة" : isEn ? "Status" : "Statut"}
                          </span>
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {isAr ? "نشط" : isEn ? "Active" : "Actif"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {isAr ? "معلق" : isEn ? "Suspended" : "Suspendu"}
                            </span>
                          )}
                        </div>

                        {/* Phone with LTR Protection */}
                        {user.phone && (
                          <div className="col-span-2 pt-1 border-t border-neutral-200/60 flex items-center justify-between gap-1.5 text-[11px] text-neutral-700">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span dir="ltr" className="font-mono truncate">
                                {user.phone}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(user.phone || "", `card-phone-${user.id}`)}
                              className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-200/60 transition-colors"
                              data-testid="copy-user-phone"
                              aria-label={isAr ? "نسخ رقم الهاتف" : isEn ? "Copy phone number" : "Copier téléphone"}
                            >
                              {copiedKey === `card-phone-${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* User ID copy */}
                        <div className="col-span-2 pt-1 border-t border-neutral-200/60 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                          <span>ID: <span dir="ltr">{user.id.slice(0, 8)}...</span></span>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.id, `card-id-${user.id}`)}
                            className="p-1 rounded hover:text-black hover:bg-neutral-200/60 transition-colors"
                            data-testid="copy-user-id"
                            aria-label={isAr ? "نسخ المعرف" : isEn ? "Copy ID" : "Copier identifiant"}
                          >
                            {copiedKey === `card-id-${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Supplier Top-Up Quick Action (Mobile) */}
                      {user.role === "SUPPLIER" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setTopUpSupplier(user)}
                          className="min-h-[38px] text-xs font-semibold flex items-center justify-center gap-1.5 w-full bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100"
                          data-testid={`mobile-topup-supplier-btn-${user.id}`}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{isAr ? "شحن رصيد المورد" : isEn ? "Top-Up Supplier Balance" : "Recharger le Solde Fournisseur"}</span>
                        </Button>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={currentUser?.sub === user.id}
                          onClick={() => setEditingUser(user)}
                          className="min-h-[40px] text-xs font-medium flex items-center justify-center gap-1.5 w-full"
                          data-testid="edit-role-btn"
                          title={
                            currentUser?.sub === user.id
                              ? isAr
                                ? "التعديل الذاتي معطل"
                                : isEn
                                ? "Self-editing disabled"
                                : "Auto-modification désactivée"
                              : isAr
                              ? "تعديل الصلاحية"
                              : isEn
                              ? "Edit role"
                              : "Modifier rôle"
                          }
                        >
                          <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{isAr ? "الصلاحية" : isEn ? "Role" : "Rôle"}</span>
                        </Button>

                        {user.isActive ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={currentUser?.sub === user.id}
                            onClick={() => setStatusConfirmUser(user)}
                            className="min-h-[40px] text-xs font-medium flex items-center justify-center gap-1.5 w-full"
                            data-testid="status-toggle-btn"
                            title={
                              currentUser?.sub === user.id
                                ? isAr
                                  ? "التعليق الذاتي غير متاح"
                                  : isEn
                                  ? "Cannot suspend yourself"
                                  : "Auto-suspension impossible"
                                : isAr
                                ? "تعليق"
                                : isEn
                                ? "Suspend"
                                : "Suspendre"
                            }
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>{isAr ? "تعليق" : isEn ? "Suspend" : "Suspendre"}</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setStatusConfirmUser(user)}
                            className="min-h-[40px] text-xs font-medium flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                            data-testid="status-toggle-btn"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isAr ? "تفعيل" : isEn ? "Activate" : "Activer"}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table (>= 1024px) */}
              <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fbfbfb]">
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "المستخدم" : isEn ? "User" : "Utilisateur"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الدور" : isEn ? "Role" : "Rôle"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الهاتف" : isEn ? "Contact" : "Contact"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الرصيد" : isEn ? "Wallet Balance" : "Solde Portefeuille"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "الحالة" : isEn ? "Status" : "Statut"}</TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">{isAr ? "تاريخ التسجيل" : isEn ? "Registration Date" : "Date Inscription"}</TableHead>
                      <TableHead className="py-4 text-end text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
                        {isAr ? "الإجراءات" : isEn ? "Actions" : "Actions"}
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
                            <span className="text-sm font-medium">{isAr ? "جاري التحميل..." : isEn ? "Loading users..." : "Chargement des utilisateurs..."}</span>
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
                              : isEn
                              ? "No users found matching these criteria"
                              : "Aucun utilisateur trouvé avec ces critères"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          className="hover:bg-neutral-50/70 transition-colors"
                          data-testid="admin-user-row"
                        >
                          {/* Name, Avatar, Email & ID */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-100 to-neutral-200/80 border border-black/[0.06] flex items-center justify-center font-bold text-xs text-neutral-800 shrink-0 select-none shadow-2xs">
                                {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-neutral-950 tracking-tight leading-snug truncate">
                                  {user.fullName || (isAr ? "بدون اسم" : isEn ? "Not specified" : "Non spécifié")}
                                </span>
                                <span className="text-xs text-[#6b6b6b] flex items-center gap-1.5 font-normal truncate mt-0.5">
                                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                  <span>{user.email}</span>
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-neutral-400 font-mono tracking-wider">
                                    ID: <span dir="ltr">{user.id.slice(0, 8)}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(user.id, `table-id-${user.id}`)}
                                    className="p-0.5 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                                    data-testid="copy-user-id"
                                    aria-label={isAr ? "نسخ معرف المستخدم" : isEn ? "Copy user ID" : "Copier ID utilisateur"}
                                  >
                                    {copiedKey === `table-id-${user.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role */}
                          <TableCell className="py-4">{getRoleBadge(user.role, isAr, isEn)}</TableCell>

                          {/* Phone with Directional Safety */}
                          <TableCell className="py-4">
                            {user.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span dir="ltr" className="text-xs font-mono font-medium text-neutral-800">
                                  {user.phone}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(user.phone || "", `table-phone-${user.id}`)}
                                  className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                                  data-testid="copy-user-phone"
                                  aria-label={isAr ? "نسخ رقم الهاتف" : isEn ? "Copy phone number" : "Copier téléphone"}
                                >
                                  {copiedKey === `table-phone-${user.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
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
                                {isAr ? "نشط" : isEn ? "Active" : "Actif"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {isAr ? "معلق" : isEn ? "Suspended" : "Suspendu"}
                              </span>
                            )}
                          </TableCell>

                          {/* Created At */}
                          <TableCell className="py-4 text-xs text-[#6b6b6b] font-mono font-medium">
                            {new Date(user.createdAt).toLocaleDateString(lang === "ar" ? "ar-DZ" : isEn ? "en-US" : "fr-FR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-4 text-end">
                            <div className="flex items-center justify-end gap-2">
                              {/* Top-up Supplier Button */}
                              {user.role === "SUPPLIER" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setTopUpSupplier(user)}
                                  className="text-xs px-2.5 py-1.5 rounded-xl font-medium gap-1.5 bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100"
                                  data-testid={`topup-supplier-btn-${user.id}`}
                                  title={isAr ? "شحن رصيد المورد" : isEn ? "Top-up supplier balance" : "Recharger solde fournisseur"}
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  <span>{isAr ? "شحن" : isEn ? "Top-Up" : "Recharger"}</span>
                                </Button>
                              )}

                              {/* Change Role Button */}
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={currentUser?.sub === user.id}
                                onClick={() => setEditingUser(user)}
                                className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5"
                                data-testid="edit-role-btn"
                                title={
                                  currentUser?.sub === user.id
                                    ? isAr
                                      ? "التعديل الذاتي معطل"
                                      : isEn
                                      ? "Self-editing disabled"
                                      : "Auto-modification désactivée"
                                    : isAr
                                    ? "تعديل الصلاحية"
                                    : isEn
                                    ? "Edit role"
                                    : "Modifier rôle"
                                }
                              >
                                <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                                <span>{isAr ? "الصلاحية" : isEn ? "Role" : "Rôle"}</span>
                              </Button>

                              {/* Suspend / Reactivate */}
                              {user.isActive ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  disabled={currentUser?.sub === user.id}
                                  onClick={() => setStatusConfirmUser(user)}
                                  className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5"
                                  data-testid="status-toggle-btn"
                                  title={
                                    currentUser?.sub === user.id
                                      ? isAr
                                        ? "التعليق الذاتي غير متاح"
                                        : isEn
                                        ? "Cannot suspend yourself"
                                        : "Auto-suspension impossible"
                                      : isAr
                                      ? "تعليق"
                                      : isEn
                                      ? "Suspend"
                                      : "Suspendre"
                                  }
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>{isAr ? "تعليق" : isEn ? "Suspend" : "Suspendre"}</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setStatusConfirmUser(user)}
                                  className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  data-testid="status-toggle-btn"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{isAr ? "تفعيل" : isEn ? "Activate" : "Activer"}</span>
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
                  {isAr ? "إغلاق" : isEn ? "Close" : "Fermer"}
                </Button>
              </div>
            )}

            {/* WCAG Accessible User Status Modal */}
            <UserStatusModal
              user={statusConfirmUser}
              isOpen={!!statusConfirmUser}
              onClose={() => setStatusConfirmUser(null)}
              onSuccess={(updatedUser) => {
                setUsers((prev) =>
                  prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
                );
                setActionMessage(
                  updatedUser.isActive
                    ? isAr
                      ? "تمت إعادة تفعيل الحساب بنجاح"
                      : isEn
                      ? "Account reactivated successfully"
                      : "Compte réactivé avec succès"
                    : isAr
                    ? "تم تعليق الحساب بنجاح"
                    : isEn
                    ? "Account suspended successfully"
                    : "Compte suspendu avec succès"
                );
                setTimeout(() => setActionMessage(null), 3500);
              }}
              lang={lang}
            />

            {/* WCAG Accessible User Role Modal */}
            <UserRoleModal
              user={editingUser}
              currentUserSub={currentUser?.sub}
              isOpen={!!editingUser}
              onClose={() => setEditingUser(null)}
              onSuccess={(updatedUser) => {
                setUsers((prev) =>
                  prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
                );
                setActionMessage(
                  isAr
                    ? "تم تعديل الصلاحية بنجاح (تم إبطال الجلسة)"
                    : isEn
                    ? "Role updated successfully (Session invalidated)"
                    : "Rôle mis à jour avec succès (Session invalidée)"
                );
                setTimeout(() => setActionMessage(null), 3500);
              }}
              lang={lang}
            />

            {/* Prepaid Escrow Supplier Top-Up Modal */}
            <AdminTopUpModal
              isOpen={!!topUpSupplier}
              onClose={() => setTopUpSupplier(null)}
              supplier={topUpSupplier}
              onSuccess={(newBalance, supplierId) => {
                setUsers((prev) =>
                  prev.map((u) => (u.id === supplierId ? { ...u, balance: newBalance } : u))
                );
                setActionMessage(
                  isAr
                    ? "تم شحن رصيد المورد بنجاح"
                    : isEn
                    ? "Supplier escrow balance credited successfully"
                    : "Solde séquestre fournisseur rechargé avec succès"
                );
                setTimeout(() => setActionMessage(null), 3500);
              }}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
