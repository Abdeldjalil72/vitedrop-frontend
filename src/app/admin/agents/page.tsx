"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  apiGetAgents,
  apiCreateAgent,
  apiAssignAgentTenant,
  apiUpdateAgentStatus,
  apiGetAdminUsers,
  CallCenterAgentItem,
  AdminUser,
} from "@/lib/api-client";
import { formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  Headphones,
  UserPlus,
  RefreshCw,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Sliders,
} from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<CallCenterAgentItem[]>([]);
  const [suppliers, setSuppliers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Agent Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    tenantId: "",
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Assign Tenant Modal state
  const [assignAgent, setAssignAgent] = useState<CallCenterAgentItem | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [agentsData, usersData] = await Promise.all([
        apiGetAgents(),
        apiGetAdminUsers(),
      ]);
      setAgents(agentsData || []);
      setSuppliers((usersData || []).filter((u) => u.role === "SUPPLIER"));
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des agents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setError(null);
    try {
      await apiCreateAgent({
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName,
        phone: createForm.phone || undefined,
        tenantId: createForm.tenantId || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({ email: "", password: "", fullName: "", phone: "", tenantId: "" });
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Échec de la création de l'agent.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAgent) return;
    setIsSubmittingAssign(true);
    setError(null);
    try {
      await apiAssignAgentTenant(assignAgent.id, selectedTenantId);
      setAssignAgent(null);
      setSelectedTenantId("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Échec de l'assignation du fournisseur.");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleToggleStatus = async (agent: CallCenterAgentItem) => {
    try {
      await apiUpdateAgentStatus(agent.id, !agent.isActive);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Échec de la mise à jour du statut.");
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";
        const isEnglish = lang === "en";

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              badge={isArabic ? "إدارة فرق التأكيد الهاتفي" : isEnglish ? "Call Center Operations" : "Call Center Multi-Tenant"}
              badgeVariant="rose"
              title={isArabic ? "وكلاء مركز الاتصال والتأكيد" : isEnglish ? "Call Center Agents" : "Agents Call Center"}
              description={
                isArabic
                  ? "إدارة حسابات تأكيد الطلبيات وتخصيص كل وكيل للمورد المناسب (Tenant Isolation)."
                  : isEnglish
                  ? "Create and assign confirmation call center agents to partner suppliers."
                  : "Création et rattachement des agents de confirmation aux fournisseurs partenaires."
              }
              actions={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading}
                    className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    {isArabic ? "تحديث" : isEnglish ? "Refresh" : "Actualiser"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="min-h-[40px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#064e3b] hover:bg-[#085a44] border border-[#0a5e47] text-amber-200 text-xs font-semibold shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-300 w-full sm:w-auto cursor-pointer"
                    data-testid="create-agent-header-btn"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    <span>{isArabic ? "إضافة وكيل جديد" : isEnglish ? "Create Agent" : "Créer un Agent"}</span>
                  </button>
                </div>
              }
            />

            {/* Error banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={loadData} className="text-xs text-rose-800">
                  {isArabic ? "إعادة المحاولة" : isEnglish ? "Retry" : "Réessayer"}
                </Button>
              </div>
            )}

            {/* Table / Cards Card */}
            <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800">
                    {agents.length} {isArabic ? "وكيل مسجل" : isEnglish ? "registered agents" : "agents enregistrés"}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="p-6 sm:p-8 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : agents.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 space-y-2">
                  <Headphones className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-sm font-medium">
                    {isArabic ? "لا يوجد أي وكلاء مسجلين حالياً" : isEnglish ? "No call center agents configured." : "Aucun agent de call center configuré."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards (Phone / Small Screens) */}
                  <div className="block sm:hidden divide-y divide-neutral-100">
                    {agents.map((agent) => (
                      <div key={agent.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-neutral-900 text-xs">{agent.fullName || "—"}</div>
                            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{agent.email}</div>
                          </div>
                          <div>
                            {agent.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {isArabic ? "نشط" : isEnglish ? "Active" : "Actif"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {isArabic ? "معلق" : isEnglish ? "Suspended" : "Suspendu"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          {agent.phone && (
                            <div className="flex items-center gap-1.5 text-neutral-700 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>{agent.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-neutral-500 text-[11px]">
                              {isArabic ? "المورد:" : isEnglish ? "Supplier:" : "Fournisseur:"}
                            </span>
                            {agent.tenantId ? (
                              <div className="flex items-center gap-1 text-purple-700 font-medium">
                                <Building className="w-3 h-3" />
                                <span>
                                  {suppliers.find((s) => s.id === agent.tenantId)?.fullName ||
                                    (isEnglish
                                      ? `Supplier ${agent.tenantId.slice(0, 8)}...`
                                      : `Fournisseur ${agent.tenantId.slice(0, 8)}...`)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-medium text-[11px]">
                                {isArabic ? "غير مخصص لمورد" : isEnglish ? "Unassigned" : "Non rattaché"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAssignAgent(agent);
                              setSelectedTenantId(agent.tenantId || "");
                            }}
                            className="min-h-[40px] text-xs flex items-center justify-center gap-1 w-full"
                          >
                            <Building className="w-3 h-3" />
                            {isArabic ? "تعيين مورد" : isEnglish ? "Assign" : "Rattacher"}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(agent)}
                            className={`min-h-[40px] text-xs font-medium flex items-center justify-center w-full border ${
                              agent.isActive
                                ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            {agent.isActive
                              ? isArabic ? "تعليق" : isEnglish ? "Suspend" : "Suspendre"
                              : isArabic ? "تفعيل" : isEnglish ? "Activate" : "Activer"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 text-start">
                            {isArabic ? "الاسم والبريد" : isEnglish ? "Agent & Email" : "Agent & Email"}
                          </th>
                          <th className="px-4 py-3 text-start">
                            {isArabic ? "الهاتف" : isEnglish ? "Phone" : "Téléphone"}
                          </th>
                          <th className="px-4 py-3 text-start">
                            {isArabic ? "المورد المخصص (Tenant)" : isEnglish ? "Assigned Supplier" : "Fournisseur Rattaché"}
                          </th>
                          <th className="px-4 py-3 text-start">
                            {isArabic ? "الحالة" : isEnglish ? "Status" : "Statut"}
                          </th>
                          <th className="px-4 py-3 text-end">
                            {isArabic ? "إجراءات" : isEnglish ? "Actions" : "Actions"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-mono">
                        {agents.map((agent) => (
                          <tr key={agent.id} className="hover:bg-neutral-50/60">
                            <td className="px-4 py-3 font-sans">
                              <div className="font-bold text-neutral-900">{agent.fullName || "—"}</div>
                              <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                {agent.email}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-700">
                              {agent.phone || "—"}
                            </td>
                            <td className="px-4 py-3 font-sans">
                              {agent.tenantId ? (
                                <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                                  <Building className="w-3.5 h-3.5" />
                                  <span>
                                    {suppliers.find((s) => s.id === agent.tenantId)?.fullName ||
                                      (isEnglish
                                        ? `Supplier ${agent.tenantId.slice(0, 8)}...`
                                        : `Fournisseur ${agent.tenantId.slice(0, 8)}...`)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-amber-600 font-medium text-[11px]">
                                  {isArabic ? "غير مخصص لمورد" : isEnglish ? "Unassigned" : "Non rattaché"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-sans">
                              {agent.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {isArabic ? "نشط" : isEnglish ? "Active" : "Actif"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  {isArabic ? "معلق" : isEnglish ? "Suspended" : "Suspendu"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-end font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setAssignAgent(agent);
                                    setSelectedTenantId(agent.tenantId || "");
                                  }}
                                  className="h-7 text-xs flex items-center gap-1"
                                >
                                  <Building className="w-3 h-3" />
                                  {isArabic ? "تعيين مورد" : isEnglish ? "Assign" : "Rattacher"}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(agent)}
                                  className={`h-7 text-xs ${
                                    agent.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                >
                                  {agent.isActive
                                    ? isArabic
                                      ? "تعليق"
                                      : isEnglish
                                      ? "Suspend"
                                      : "Suspendre"
                                    : isArabic
                                    ? "تفعيل"
                                    : isEnglish
                                    ? "Activate"
                                    : "Activer"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Create Agent Modal */}
            <Modal
              isOpen={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              title={isArabic ? "إنشاء حساب وكيل جديد" : isEnglish ? "Create Call Center Agent" : "Créer un Agent Call Center"}
              maxWidth="md"
            >
              <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2 text-start">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isArabic ? "الاسم الكامل" : isEnglish ? "Full Name" : "Nom & Prénom"}
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isArabic ? "البريد الإلكتروني" : isEnglish ? "Email Address" : "Adresse Email"}
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isArabic ? "كلمة المرور" : isEnglish ? "Password" : "Mot de Passe"}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isArabic ? "رقم الهاتف" : isEnglish ? "Phone Number (Optional)" : "Téléphone (Optionnel)"}
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isArabic ? "المورد المخصص (Tenant)" : isEnglish ? "Assigned Supplier (Tenant)" : "Fournisseur de Rattachement"}
                  </label>
                  <select
                    value={createForm.tenantId}
                    onChange={(e) => setCreateForm({ ...createForm, tenantId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white"
                  >
                    <option value="">
                      {isArabic ? "اختر مورداً..." : isEnglish ? "Select a supplier..." : "Sélectionner un fournisseur..."}
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName || s.email} ({s.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmittingCreate}
                  >
                    {isArabic ? "إلغاء" : isEnglish ? "Cancel" : "Annuler"}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSubmittingCreate}>
                    {isSubmittingCreate
                      ? isEnglish ? "Creating..." : "Création..."
                      : isArabic ? "إنشاء الوكيل" : isEnglish ? "Create Agent" : "Créer"}
                  </Button>
                </div>
              </form>
            </Modal>

            {/* Assign Tenant Modal */}
            <Modal
              isOpen={!!assignAgent}
              onClose={() => setAssignAgent(null)}
              title={isArabic ? "تخصيص وكيل لمورد" : isEnglish ? "Assign Agent to Supplier" : "Rattacher l'Agent à un Fournisseur"}
              maxWidth="sm"
            >
              <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2 text-start">
                <p className="text-xs text-neutral-600">
                  {isArabic
                    ? `تخصيص الوكيل "${assignAgent?.fullName || assignAgent?.email}" لقائمة طلبيات مورد محدد:`
                    : isEnglish
                    ? `Select the supplier account whose orders agent "${assignAgent?.fullName || assignAgent?.email}" will confirm:`
                    : `Sélectionnez le compte fournisseur dont l'agent "${assignAgent?.fullName || assignAgent?.email}" pourra confirmer les leads :`}
                </p>

                <div>
                  <select
                    required
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white"
                  >
                    <option value="">
                      {isArabic ? "اختر مورداً..." : isEnglish ? "Select a supplier..." : "Sélectionner un fournisseur..."}
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName || s.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAssignAgent(null)}
                    disabled={isSubmittingAssign}
                  >
                    {isArabic ? "إلغاء" : isEnglish ? "Cancel" : "Annuler"}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSubmittingAssign}>
                    {isSubmittingAssign
                      ? isEnglish ? "Saving..." : "Enregistrement..."
                      : isArabic ? "حفظ" : isEnglish ? "Save" : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </Modal>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
