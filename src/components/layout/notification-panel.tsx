"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell } from "@/components/ui/icons";
import { getNotifications, markAllRead, markRead } from "@/lib/actions/notifications";
import type { Notification } from "@/types/database";

const TYPE_LABELS: Record<string, string> = {
  sla_warning: "SLA Warning",
  sla_breach: "SLA Breach",
  case_assigned: "Case Assigned",
  report_ready: "Report Ready",
  comment_added: "Comment",
  new_suspicion: "New Case",
  status_update: "Status Update",
  report_filed: "Report Filed",
};

const RESOURCE_LINKS: Record<string, (id: string) => string> = {
  case: (id) => `/suspicions/${id}`,
  report: (id) => `/reports/${id}`,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationPanel({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function openPanel() {
    setOpen(true);
    if (!loaded) {
      const { data } = await getNotifications();
      setNotifications(data);
      setLoaded(true);
    }
    // Mark all read after a short delay so the user sees them highlighted first
    if (unread > 0) {
      setTimeout(() => {
        startTransition(async () => {
          await markAllRead();
          setUnread(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        });
      }, 800);
    }
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      await markRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    }
    if (n.resource_id && n.resource_type) {
      const href = RESOURCE_LINKS[n.resource_type]?.(n.resource_id);
      if (href) window.location.href = href;
    }
    setOpen(false);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="relative w-[34px] h-[34px] flex items-center justify-center rounded-md text-text-secondary hover:bg-sidebar-hover transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-red rounded-full border-2 border-surface" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[340px] bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[13px] font-semibold">Notifications</span>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={() => {
                  startTransition(async () => {
                    await markAllRead();
                    setUnread(0);
                    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  });
                }}
                className="text-[12px] text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {!loaded ? (
              <div className="px-4 py-8 text-center text-[13px] text-text-tertiary">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-text-tertiary">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-alt transition-colors flex gap-3 ${
                    !n.is_read ? "bg-accent/3" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-foreground leading-snug truncate">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[12px] text-text-tertiary mt-0.5 line-clamp-2 leading-snug">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[11px] text-text-tertiary mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
