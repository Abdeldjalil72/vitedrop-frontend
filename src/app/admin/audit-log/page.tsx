"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  apiGetAuditLogs,
  AuditLogItem,
  AuditLogQuery,
} from "@/lib/api-client";
import { formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileText,
} from "lucide-react";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AuditLogQuery>({
    limit: 25,
    offset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGetAuditLogs(filters);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des journaux d'audit.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 25)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 25)) || 1;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              badge={isArabic ? "سجل الرقابة والأمان" : "Immutable Audit Trail"}
              badgeVariant="rose"
              title={isArabic ? "سجل تدقيق العمليات الإدارية" : "Journal d'Audit des Administrateurs"}
              description={
                isArabic
                  ? "سجل غير قابل للتعديل يوثق كافة التدخلات الإدارية: الموافقة على السحوبات، تغيير الأدوار، وتعليق المنتجات."
                  : "Traçabilité complète des actions sensibles : approbations, suspensions et régularisations."
              }
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadLogs}
                  disabled={isLoading}
                  className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {isArabic ? "تحديث" : "Actualiser"}
                </Button>
              }
            />

            {/* Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-56">
                <select
                  value={filters.action || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      action: e.target.value || undefined,
                      offset: 0,
                    }))
                  }
                  className="w-full min-h-[40px] sm:min-h-0 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="">{isArabic ? "جميع العمليات" : "Toutes les actions"}</option>
                  <option value="WITHDRAWAL_APPROVE">WITHDRAWAL_APPROVE</option>
                  <option value="WITHDRAWAL_REJECT">WITHDRAWAL_REJECT</option>
                  <option value="WITHDRAWAL_PAID">WITHDRAWAL_PAID</option>
                  <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
                  <option value="USER_STATUS_CHANGE">USER_STATUS_CHANGE</option>
                  <option value="PRODUCT_STATUS_CHANGE">PRODUCT_STATUS_CHANGE</option>
                  <option value="ORDER_NOTE_ADDED">ORDER_NOTE_ADDED</option>
                  <option value="RECONCILIATION_RUN">RECONCILIATION_RUN</option>
                </select>
              </div>

              <div className="w-full sm:w-56">
                <select
                  value={filters.entityType || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      entityType: e.target.value || undefined,
                      offset: 0,
                    }))
                  }
                  className="w-full min-h-[40px] sm:min-h-0 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="">{isArabic ? "جميع الكيانات" : "Toutes les entités"}</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="User">User</option>
                  <option value="Product">Product</option>
                  <option value="Order">Order</option>
                  <option value="Reconciliation">Reconciliation</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={loadLogs} className="text-xs text-rose-800">
                  {isArabic ? "إعادة المحاولة" : "Réessayer"}
                </Button>
              </div>
            )}

            {/* Table / Cards Card */}
            <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800">
                    {total} {isArabic ? "عملية مسجلة" : "événements d'audit"}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {isArabic ? `الصفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} sur ${totalPages}`}
                </span>
              </div>

              {isLoading ? (
                <div className="p-6 sm:p-8 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-sm font-medium">
                    {isArabic ? "لا توجد عمليات تطابق البحث" : "Aucun événement d'audit trouvé."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards (Phone / Small Screens) */}
                  <div className="block sm:hidden divide-y divide-neutral-100">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 font-mono text-xs text-neutral-900 font-bold">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            {formatDateTime(log.createdAt, lang)}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-neutral-500 text-[11px]">
                              {isArabic ? "المسؤول:" : "Opérateur:"}
                            </span>
                            <span className="font-medium text-neutral-900 font-sans truncate max-w-[180px]">
                              {log.adminEmail || log.adminId.slice(0, 8)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-neutral-500 text-[11px]">
                              {isArabic ? "الكيان:" : "Cible:"}
                            </span>
                            <span className="font-mono text-neutral-700 text-[11px] truncate max-w-[180px]">
                              {log.entityType} ({log.entityId.slice(0, 8)}...)
                            </span>
                          </div>

                          {log.reason && (
                            <div className="text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100">
                              <span className="font-semibold text-neutral-700 me-1">Motif:</span>
                              {log.reason}
                            </div>
                          )}
                        </div>

                        <div className="pt-1 flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="min-h-[36px] px-3 text-xs text-neutral-700 font-medium flex items-center justify-center gap-1.5 w-full"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isArabic ? "فحص التغييرات (Diff)" : "Examiner le Diff"}
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
                          <th className="px-4 py-3 text-start">{isArabic ? "العملية" : "Action"}</th>
                          <th className="px-4 py-3 text-start">{isArabic ? "المسؤول (Admin)" : "Opérateur"}</th>
                          <th className="px-4 py-3 text-start">{isArabic ? "الكيان والمعرف" : "Entité Cible"}</th>
                          <th className="px-4 py-3 text-start">{isArabic ? "السبب / الملاحظة" : "Motif"}</th>
                          <th className="px-4 py-3 text-start">{isArabic ? "التاريخ والوقت" : "Horodatage"}</th>
                          <th className="px-4 py-3 text-end">{isArabic ? "فحص الحالة" : "Inspection"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-mono">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-neutral-50/60">
                            <td className="px-4 py-3 font-bold text-neutral-900 font-sans">
                              <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 font-mono text-[11px] text-neutral-800">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-sans">
                              <div className="font-medium text-neutral-800">
                                {log.adminEmail || log.adminId.slice(0, 8)}...
                              </div>
                              {log.ipAddress && (
                                <div className="text-[10px] text-neutral-400 font-mono">
                                  IP: {log.ipAddress}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-neutral-700 font-sans">
                                {log.entityType}
                              </span>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {log.entityId}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-sans text-neutral-600 max-w-[200px] truncate">
                              {log.reason || "—"}
                            </td>
                            <td className="px-4 py-3 text-neutral-500 text-[11px]">
                              {formatDateTime(log.createdAt, lang)}
                            </td>
                            <td className="px-4 py-3 text-end font-sans">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                                className="h-7 px-2 text-xs text-neutral-600 hover:text-neutral-900"
                              >
                                <Eye className="w-3.5 h-3.5 me-1" />
                                Diff
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3.5 sm:p-4 border-t border-neutral-100 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        offset: (prev.offset || 0) - (prev.limit || 25),
                      }))
                    }
                    className="min-h-[40px] sm:min-h-0 text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    {isArabic ? "السابق" : "Précédent"}
                  </Button>
                  <span className="text-xs text-neutral-600 font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        offset: (prev.offset || 0) + (prev.limit || 25),
                      }))
                    }
                    className="min-h-[40px] sm:min-h-0 text-xs flex items-center gap-1"
                  >
                    {isArabic ? "التالي" : "Suivant"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Audit Inspector Modal */}
            <Modal
              isOpen={!!selectedLog}
              onClose={() => setSelectedLog(null)}
              title={isArabic ? "تفاصيل التغيير وحالة الكيان" : "Inspection du Changement d'État"}
              maxWidth="lg"
            >
              {selectedLog && (
                <div className="space-y-4 pt-2 text-start text-xs font-mono">
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 font-sans space-y-1">
                    <div>
                      <strong>Action:</strong> {selectedLog.action}
                    </div>
                    <div>
                      <strong>Entity:</strong> {selectedLog.entityType} ({selectedLog.entityId})
                    </div>
                    {selectedLog.reason && (
                      <div>
                        <strong>Motif:</strong> {selectedLog.reason}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="font-sans font-bold text-neutral-600 block mb-1">
                        État Précédent (Before)
                      </span>
                      <pre className="p-3 bg-neutral-900 text-rose-300 rounded-lg text-[11px] overflow-x-auto max-h-64">
                        {JSON.stringify(selectedLog.beforeState, null, 2) || "{}"}
                      </pre>
                    </div>

                    <div>
                      <span className="font-sans font-bold text-neutral-600 block mb-1">
                        Nouvel État (After)
                      </span>
                      <pre className="p-3 bg-neutral-900 text-emerald-300 rounded-lg text-[11px] overflow-x-auto max-h-64">
                        {JSON.stringify(selectedLog.afterState, null, 2) || "{}"}
                      </pre>
                    </div>
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
