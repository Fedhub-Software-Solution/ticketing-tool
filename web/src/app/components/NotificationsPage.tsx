import { Bell, Clock, Ticket } from 'lucide-react';
import { Card } from './common/ui/card';
import { Button } from './common/ui/button';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/app/store/apis/notificationsApi';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useGetNotificationsQuery(undefined, { pollingInterval: 20000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Bell className={`${iconClass} text-orange-600`} />
          </div>
        );
      case 'escalation':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Bell className={`${iconClass} text-red-600`} />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <Bell className={`${iconClass} text-green-600`} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Bell className={`${iconClass} text-blue-600`} />
          </div>
        );
    }
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center border-slate-200">
          <p className="text-slate-500">Loading notifications...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mt-1">All your notifications in one place.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200"
            onClick={() => markAllRead()}
          >
            Mark all read
          </Button>
        )}
      </div>

      <Card className="border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No notifications yet.</p>
            <p className="text-slate-400 text-sm mt-1">When you get notifications, they will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.li
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex gap-4 p-5 hover:bg-slate-50/80 transition-colors ${
                    !notification.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">{notification.title}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{notification.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notification.read && !notification.synthetic && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:bg-blue-50"
                            onClick={() => markRead(notification.id)}
                          >
                            Mark read
                          </Button>
                        )}
                        <div className="flex items-center text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatDistanceToNow(new Date(notification.time || notification.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {(notification.ticketNumber || notification.ticketId) && (
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        Ticket #{notification.ticketNumber || notification.ticketId}
                      </p>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </div>
  );
}
