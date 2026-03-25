import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ExternalLink, Trash2, Loader2, Rss, RefreshCw, Calendar, Newspaper, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { enUS, ptBR, es, fr, de, it, ru, ja } from "date-fns/locale";
import type { RssFeed, RssFeedItem } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type RssFeedItemWithTitle = RssFeedItem & { feedTitle: string };

const localeMap: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  it: it,
  ru: ru,
  ja: ja,
};

interface SortableFeedCardProps {
  feed: RssFeed;
  feedItems: RssFeedItemWithTitle[];
  onRefresh: (id: string) => void;
  onDelete: (feed: RssFeed) => void;
  isRefreshing: boolean;
  t: (key: string) => string;
  locale: Locale;
}

function SortableFeedCard({ feed, feedItems, onRefresh, onDelete, isRefreshing, t, locale }: SortableFeedCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feed.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card data-testid={`card-rss-feed-${feed.id}`} className={isDragging ? "ring-2 ring-accent" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground touch-none"
                data-testid={`drag-handle-feed-${feed.id}`}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate flex items-center gap-2">
                  <Rss className="w-4 h-4 flex-shrink-0 text-accent" />
                  {feed.title}
                </CardTitle>
                {feed.lastFetchedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("home.rssFeeds.updated")} {formatDistanceToNow(new Date(feed.lastFetchedAt), { addSuffix: true, locale })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRefresh(feed.id)}
                disabled={isRefreshing}
                title={t("home.rssFeeds.refreshFeed")}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(feed)}
                title={t("home.rssFeeds.removeFeed")}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {feedItems.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{t("home.rssFeeds.noArticles")}</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px] pr-3">
              <div className="space-y-2">
                {feedItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded-md hover-elevate border bg-muted/30"
                    data-testid={`link-rss-item-${item.id}`}
                  >
                    <div className="flex gap-3">
                      {item.imageUrl && (
                        <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-medium text-sm line-clamp-2 leading-tight">{item.title}</h4>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 text-muted-foreground mt-0.5" />
                        </div>
                        {item.publishedAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale })}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RssFeedsSection() {
  const { t, i18n } = useTranslation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<RssFeed | null>(null);
  const { toast } = useToast();

  const currentLocale = localeMap[i18n.language] || enUS;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: feeds = [], isLoading: feedsLoading } = useQuery<RssFeed[]>({
    queryKey: ["/api/rss-feeds"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<RssFeedItemWithTitle[]>({
    queryKey: ["/api/rss-feeds/items"],
  });

  const createMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/rss-feeds", { url });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds/items"] });
      toast({ title: t("home.rssFeeds.feedAdded"), description: t("home.rssFeeds.feedAddedDesc") });
      setAddDialogOpen(false);
      setUrlInput("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message || t("home.rssFeeds.invalidUrl"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rss-feeds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds/items"] });
      toast({ title: t("home.rssFeeds.feedRemoved"), description: t("home.rssFeeds.feedRemovedDesc") });
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/rss-feeds/${id}/refresh`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds/items"] });
      toast({ title: t("home.rssFeeds.feedRefreshed"), description: t("home.rssFeeds.feedRefreshedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (feedIds: string[]) => {
      await apiRequest("PUT", "/api/rss-feeds/order", { feedIds });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
    },
  });

  const handleAddFeed = () => {
    if (!urlInput.trim()) return;
    createMutation.mutate(urlInput.trim());
  };

  const handleDeleteClick = (feed: RssFeed) => {
    setFeedToDelete(feed);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (feedToDelete) {
      deleteMutation.mutate(feedToDelete.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = feeds.findIndex(f => f.id === active.id);
      const newIndex = feeds.findIndex(f => f.id === over.id);
      
      const newOrder = arrayMove(feeds, oldIndex, newIndex);
      const newFeedIds = newOrder.map(f => f.id);
      
      queryClient.setQueryData(["/api/rss-feeds"], newOrder);
      reorderMutation.mutate(newFeedIds);
    }
  };

  const getItemsForFeed = (feedId: string) => items.filter(item => item.feedId === feedId);

  const isLoading = feedsLoading || itemsLoading;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Rss className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">{t("home.rssFeeds.title")}</h2>
            {reorderMutation.isPending && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("home.rssFeeds.saving")}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            data-testid="button-add-rss-feed"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("home.rssFeeds.addFeed")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("home.rssFeeds.description")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-md" />
          ))}
        </div>
      ) : feeds.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Newspaper className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">
              {t("home.rssFeeds.noFeeds")}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {t("home.rssFeeds.noFeedsHint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={feeds.map(f => f.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feeds.map((feed) => (
                <SortableFeedCard
                  key={feed.id}
                  feed={feed}
                  feedItems={getItemsForFeed(feed.id)}
                  onRefresh={(id) => refreshMutation.mutate(id)}
                  onDelete={handleDeleteClick}
                  isRefreshing={refreshMutation.isPending}
                  t={t}
                  locale={currentLocale}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("home.rssFeeds.addFeedTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("home.rssFeeds.feedUrl")}
              </label>
              <Input
                placeholder="https://blog.example.com/feed"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
                data-testid="input-rss-feed-url"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("home.rssFeeds.urlHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddFeed}
              disabled={!urlInput.trim() || createMutation.isPending}
              data-testid="button-confirm-add-feed"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("home.rssFeeds.deleteFeed")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("home.rssFeeds.deleteConfirmation", { title: feedToDelete?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
