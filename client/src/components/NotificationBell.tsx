import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR, enUS, es, fr, de, it, ru, ja } from "date-fns/locale";

interface Message {
  id: string;
  title: string;
  content: string;
  targetUserId: string | null;
  isGlobal: boolean;
  createdAt: string;
}

const DATE_LOCALES: Record<string, typeof ptBR> = {
  pt: ptBR,
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  it: it,
  ru: ru,
  ja: ja,
};

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const dateLocale = useMemo(() => {
    return DATE_LOCALES[i18n.language] || DATE_LOCALES.pt;
  }, [i18n.language]);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/unread"],
    refetchInterval: 60000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread"] });
    },
  });

  const unreadCount = messages.length;

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    setModalOpen(true);
    setOpen(false);
  };

  const closeMessage = () => {
    if (selectedMessage) {
      markReadMutation.mutate(selectedMessage.id);
    }
    setSelectedMessage(null);
    setModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: dateLocale });
    } catch {
      return "";
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="relative text-white md:text-foreground"
            data-testid="button-notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between gap-2 p-3 border-b">
            <h4 className="font-medium">{t("common.notifications.title")}</h4>
          </div>
          <ScrollArea className="max-h-80">
            {messages.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {t("common.notifications.empty")}
              </div>
            ) : (
              <div className="divide-y">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 cursor-pointer hover-elevate bg-muted/50"
                    onClick={() => openMessage(message)}
                    data-testid={`notification-${message.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{message.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Dialog open={modalOpen} onOpenChange={(isOpen) => !isOpen && closeMessage()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMessage?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm whitespace-pre-wrap">{selectedMessage?.content}</p>
            {selectedMessage && (
              <p className="text-xs text-muted-foreground mt-4">
                {t("common.notifications.receivedAt")} {formatDate(selectedMessage.createdAt)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={closeMessage} data-testid="button-close-message">
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
