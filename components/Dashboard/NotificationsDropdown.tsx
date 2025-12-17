
"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsDropdown({ artistId }: { artistId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications/list?artist_id=${artistId}`);
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        if (artistId) {
            fetchNotifications();
            // Optional: Poll every 60s
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [artistId]);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleMarkRead = async (item: any) => {
        if (!item.is_read) {
            await fetch('/api/notifications/mark-read', {
                method: 'PATCH',
                body: JSON.stringify({ notification_id: item.id })
            });
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // Navigate
        if (item.entity_type === 'project') router.push(`/projects`);
        if (item.entity_type === 'booking') router.push(`/calendar`);
        // We could be more specific with URLs if pages existed
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-all text-[#e0e0e0]"
            >
                {/* Bell Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Notifications</h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-white/40 text-sm italic">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleMarkRead(item)}
                                    className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors relative group
                                        ${!item.is_read ? 'bg-blue-500/5' : ''}
                                    `}
                                >
                                    {!item.is_read && (
                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-sm text-white">{item.title}</span>
                                        <span className="text-[10px] text-white/40">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-white/70 line-clamp-2">{item.body}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
