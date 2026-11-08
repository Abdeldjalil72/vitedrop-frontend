"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { apiUpdateUserRole, AdminUser } from "@/lib/api-client";
import { Shield, Briefcase, Users, Headphones, CheckCircle2, AlertCircle, X } from "lucide-react";

interface UserRoleModalProps {
  user: AdminUser | null;
  currentUserSub?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: AdminUser) => void;
  lang: Language;
}

const roleModalTranslations = {
  fr: {
    title: "Modifier le Rôle Utilisateur",
    selectRole: "Sélectionnez le nouveau rôle opérationnel :",
    roles: {
      AFFILIATE: {
        label: "Affilié (Media Buyer)",
        desc: "Accès marketplace, génération de liens CPA, suivi des leads et retraits.",
      },
      SUPPLIER: {
        label: "Fournisseur (Supplier)",
        desc: "Publication du catalogue, expédition des commandes et compte séquestre escrow.",
      },
      CALL_CENTER_AGENT: {
        label: "Agent Call Center",
        desc: "Confirmation téléphonique des commandes pour son fournisseur assigné.",
      },
      ADMIN: {
        label: "Administrateur Système",
        desc: "Accès total, trésorerie escrow, clearinghouse et supervision globale.",
      },
    },
    selfDemotionBlocked:
      "Sécurité : Vous ne pouvez pas modifier votre propre rôle administrateur.",
    auditNoteLabel: "Motif du changement de rôle (Optionnel)",
    auditNotePlaceholder: "Ex: Promotion interne, migration de compte fournisseur...",
    cancel: "Annuler",
    save: "Appliquer le Rôle",
    saving: "Enregistrement...",
  },
  en: {
    title: "Modify User Role",
    selectRole: "Select new operational role:",
    roles: {
      AFFILIATE: {
        label: "Affiliate (Media Buyer)",
        desc: "Marketplace access, CPA link creation, lead tracking, and withdrawals.",
      },
      SUPPLIER: {
        label: "Supplier (Merchant)",
        desc: "Catalog publishing, order fulfillment, and prepaid escrow deposits.",
      },
      CALL_CENTER_AGENT: {
        label: "Call Center Agent",
        desc: "Telephone confirmation of orders for assigned supplier tenant.",
      },
      ADMIN: {
        label: "System Administrator",
        desc: "Full administrative access, treasury escrow, clearinghouse, and supervision.",
      },
    },
    selfDemotionBlocked:
      "Security guard: You cannot modify your own administrator role.",
    auditNoteLabel: "Role change reason (Optional)",
    auditNotePlaceholder: "e.g. Internal promotion, merchant onboarding...",
    cancel: "Cancel",
    save: "Apply Role",
    saving: "Saving...",
  },
  ar: {
    title: "تعديل صلاحية المستخدم",
    selectRole: "حدد الدور التشغيلي الجديد:",
    roles: {
      AFFILIATE: {
        label: "مسوق بالعمولة (Media Buyer)",
        desc: "الوصول للمتجر، إنشاء روابط الإحالة وتتبع الطلبيات وسحب الأرباح.",
      },
      SUPPLIER: {
        label: "مورد تجاري (Supplier)",
        desc: "نشر المنتجات، معالجة وتأكيد الشحن ورصيد الضمان المالي.",
      },
      CALL_CENTER_AGENT: {
        label: "موظف مركز الاتصال",
        desc: "تأكيد الطلبيات هاتفياً لصالح المورد المخصص.",
      },
      ADMIN: {
        label: "مسؤول المنظومة (Admin)",
        desc: "صلاحيات رقابية كاملة، إدارة الخزينة وتسوية الضمان المالي.",
      },
    },
    selfDemotionBlocked:
      "حماية الأمان: لا يمكنك تعديل صلاحيات حسابك الإداري الحالي.",
    auditNoteLabel: "سبب تعديل الصلاحية (اختياري)",
    auditNotePlaceholder: "مثال: ترقية إدارية، ترقية حساب مورد...",
    cancel: "إلغاء",
    save: "تطبيق الصلاحية",
    saving: "جار الحفظ...",
  },
};

export function UserRoleModal({
  user,
  currentUserSub,
  isOpen,
  onClose,
  onSuccess,
  lang = "fr",
}: UserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = roleModalTranslations[lang] || roleModalTranslations.fr;
  const isSelf = user && currentUserSub ? user.id === currentUserSub : false;

  useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(user.role);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelf) {
      setError(t.selfDemotionBlocked);
      return;
    }

    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiUpdateUserRole(user.id, selectedRole);
      onSuccess({
        ...user,
        role: selectedRole as any,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la modification du rôle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: Array<{ id: "AFFILIATE" | "SUPPLIER" | "CALL_CENTER_AGENT" | "ADMIN"; icon: any; color: string }> = [
    { id: "AFFILIATE", icon: Users, color: "text-sky-600 bg-sky-50" },
    { id: "SUPPLIER", icon: Briefcase, color: "text-purple-600 bg-purple-50" },
    { id: "CALL_CENTER_AGENT", icon: Headphones, color: "text-amber-600 bg-amber-50" },
    { id: "ADMIN", icon: Shield, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 [overscroll-behavior:contain]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-role-modal-title"
      data-testid="user-role-modal"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden text-start animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] [overscroll-behavior:contain]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Shield className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <h2
                id="user-role-modal-title"
                className="text-sm font-bold text-neutral-900 tracking-tight"
              >
                {t.title}
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                <span dir="ltr">{user.email}</span> &bull; <span dir="ltr">{user.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label={t.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
          {/* Target Identity info */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-1">
            <div className="font-semibold text-neutral-900">
              {user.fullName || (lang === "ar" ? "بدون اسم" : lang === "en" ? "Not specified" : "Non spécifié")}
            </div>
            <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
              <span>{lang === "ar" ? "الدور الحالي :" : lang === "en" ? "Current role:" : "Rôle actuel :"} <strong>{user.role}</strong></span>
              <span>{lang === "ar" ? "الرصيد :" : lang === "en" ? "Balance:" : "Solde :"} <span dir="ltr">{user.balance.toLocaleString()} DZD</span></span>
            </div>
          </div>

          {isSelf && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{t.selfDemotionBlocked}</span>
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-900 block">
              {t.selectRole}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {roleOptions.map((opt) => {
                const roleData = t.roles[opt.id];
                const isSelected = selectedRole === opt.id;
                const Icon = opt.icon;

                return (
                  <div
                    key={opt.id}
                    onClick={() => !isSelf && setSelectedRole(opt.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900/10 shadow-2xs"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
                    } ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
                    data-testid={`role-option-${opt.id.toLowerCase()}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${opt.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-neutral-900">
                          {roleData.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                        {roleData.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2"
              data-testid="role-modal-error"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isSelf || selectedRole === user.role}
              className="text-xs bg-neutral-900 hover:bg-black text-white"
              data-testid="confirm-role-btn"
            >
              {isSubmitting ? t.saving : t.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
