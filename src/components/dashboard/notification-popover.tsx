"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  Banknote,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Coins,
  ShieldAlert,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  apiGetNotifications,
  apiGetUnreadNotificationCount,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  NotificationItem,
  NotificationType,
} from "@/lib/api-client";
import { Language, isRTL } from "@/lib/locales";

interface NotificationPopoverProps {
  lang?: Language;
}

const translations = {
  fr: {
    title: "Notifications",
    all: "Toutes",
    unread: "Non lues",
    markAllRead: "Tout marquer comme lu",
    emptyAll: "Aucune notification pour le moment.",
    emptyUnread: "Toutes vos notifications sont lues !",
    loading: "Chargement...",
    justNow: "À l'instant",
    minutesAgo: (m: number) => `Il y a ${m} min`,
    hoursAgo: (h: number) => `Il y a ${h} h`,
    yesterday: "Hier",
    daysAgo: (d: number) => `Il y a ${d} j`,
    newBadge: "nouveau(x)",
  },
  en: {
    title: "Notifications",
    all: "All",
    unread: "Unread",
    markAllRead: "Mark all as read",
    emptyAll: "No notifications yet.",
    emptyUnread: "All caught up!",
    loading: "Loading...",
    justNow: "Just now",
    minutesAgo: (m: number) => `${m}m ago`,
    hoursAgo: (h: number) => `${h}h ago`,
    yesterday: "Yesterday",
    daysAgo: (d: number) => `${d}d ago`,
    newBadge: "new",
  },
  ar: {
    title: "التنبيهات",
    all: "الكل",
    unread: "غير مقروءة",
    markAllRead: "تحديد الكل كمقروء",
    emptyAll: "لا توجد تنبيهات حالياً.",
    emptyUnread: "تمت قراءة جميع التنبيهات !",
    loading: "جارٍ التحميل...",
    justNow: "الآن",
    minutesAgo: (m: number) => `منذ ${m} د`,
    hoursAgo: (h: number) => `منذ ${h} س`,
    yesterday: "أمس",
    daysAgo: (d: number) => `منذ ${d} أيام`,
    newBadge: "جديد",
  },
};

function formatRelativeTime(dateStr: string, lang: Language): string {
  const t = translations[lang] || translations.fr;
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return t.justNow;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t.minutesAgo(diffMin);
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return t.yesterday;
  if (diffDays < 7) return t.daysAgo(diffDays);

  return date.toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "en" ? "en-US" : "fr-DZ", {
    day: "numeric",
    month: "short",
  });
}

function getNotificationVisual(type: NotificationType) {
  switch (type) {
    case "COMMISSION_EARNED":
    case "WITHDRAWAL_PAID":
    case "DEPOSIT_APPROVED":
      return {
        icon: Banknote,
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
      };
    case "ORDER_DELIVERED":
      return {
        icon: CheckCircle2,
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-200",
      };
    case "ORDER_CREATED":
      return {
        icon: Package,
        bg: "bg-sky-50",
        text: "text-sky-700",
        border: "border-sky-200",
      };
    case "WITHDRAWAL_APPROVED":
      return {
        icon: Coins,
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    case "WITHDRAWAL_REJECTED":
    case "DEPOSIT_REJECTED":
    case "ORDER_RETURNED":
      return {
        icon: XCircle,
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
      };
    case "STOCK_ALERT":
    case "ADMIN_NEW_WITHDRAWAL":
    case "ADMIN_NEW_DEPOSIT":
      return {
        icon: AlertTriangle,
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
      };
    case "SYSTEM_NOTICE":
    default:
      return {
        icon: ShieldAlert,
        bg: "bg-neutral-100",
        text: "text-neutral-700",
        border: "border-neutral-200",
      };
  }
}

export function NotificationPopover({ lang = "fr" }: NotificationPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const t = translations[lang] || translations.fr;
  const rtl = isRTL(lang);

  // 1. Fetch unread count for the bell badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiGetUnreadNotificationCount();
      if (res && typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // silent fallback
    }
  }, []);

  // 2. Fetch notifications list
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    setIsLoading(true);
    try {
      const res = await apiGetNotifications(30, 0, unreadOnly);
      if (res && Array.isArray(res.data)) {
        setNotifications(res.data);
        if (typeof res.unreadCount === "number") {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (err) {
      console.debug("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and periodic lightweight polling (every 30s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load list when popover opens or filter changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(activeTab === "unread");
    }
  }, [isOpen, activeTab, fetchNotifications]);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark single notification as read & navigate
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      apiMarkNotificationRead(item.id).catch(() => {});
    }

    setIsOpen(false);

    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await apiMarkAllNotificationsRead();
    } catch (err) {
      console.debug("Failed to mark all notifications read:", err);
      fetchUnreadCount();
    }
  };

  const filteredNotifications =
    activeTab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 sm:p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors relative cursor-pointer"
        aria-label={t.title}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs border-2 border-white animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          dir={rtl ? "rtl" : "ltr"}
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[390px] bg-white rounded-3xl shadow-2xl border border-neutral-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-start"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between gap-2 bg-neutral-50/70">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-neutral-900">{t.title}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                  {unreadCount} {t.newBadge}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t.markAllRead}</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-neutral-100 bg-white px-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === "all"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.all}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === "unread"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.unread} {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 overscroll-contain">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">{t.loading}</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-2.5">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-neutral-600">
                  {activeTab === "unread" ? t.emptyUnread : t.emptyAll}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const visual = getNotificationVisual(item.type);
                const IconComponent = visual.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-neutral-50 relative group ${
                      !item.isRead ? "bg-sky-50/25" : "bg-white"
                    }`}
                  >
                    {/* Visual Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl ${visual.bg} ${visual.text} border ${visual.border} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-bold truncate block ${
                            !item.isRead ? "text-neutral-900" : "text-neutral-700"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                          {formatRelativeTime(item.createdAt, lang)}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                    </div>

                    {/* Unread blue dot */}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

