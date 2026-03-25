import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, ExternalLink, Trash2, Loader2, Link as LinkIcon, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FavoriteLink } from "@shared/schema";

export default function FavoriteLinksSection() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<FavoriteLink | null>(null);
  const { toast } = useToast();

  const { data: links = [], isLoading } = useQuery<FavoriteLink[]>({
    queryKey: ["/api/favorite-links"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { url: string; title: string; description?: string; imageUrl?: string }) => {
      const response = await apiRequest("POST", "/api/favorite-links", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-links"] });
      toast({ title: t("home.favoriteLinks.linkAdded"), description: t("home.favoriteLinks.linkAddedDesc") });
      setDialogOpen(false);
      setUrlInput("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/favorite-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-links"] });
      toast({ title: t("home.favoriteLinks.linkRemoved"), description: t("home.favoriteLinks.linkRemovedDesc") });
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleAddLink = async () => {
    if (!urlInput.trim()) return;
    
    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setFetching(true);
    try {
      const response = await apiRequest("POST", "/api/fetch-url-metadata", { url });
      const metadata = await response.json();
      
      createMutation.mutate({
        url,
        title: metadata.title || url,
        description: metadata.description || undefined,
        imageUrl: metadata.imageUrl || undefined,
      });
    } catch {
      createMutation.mutate({
        url,
        title: url,
      });
    } finally {
      setFetching(false);
    }
  };

  const handleDeleteClick = (link: FavoriteLink) => {
    setLinkToDelete(link);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (linkToDelete) {
      deleteMutation.mutate(linkToDelete.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">{t("home.favoriteLinks.title")}</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          data-testid="button-add-favorite-link"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("common.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <LinkIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">
              {t("home.favoriteLinks.noLinks")}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {t("home.favoriteLinks.noLinksHint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <Card
              key={link.id}
              className="group relative overflow-hidden hover-elevate"
              data-testid={`card-favorite-link-${link.id}`}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {link.imageUrl ? (
                  <div className="h-24 bg-muted overflow-hidden">
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-muted flex items-center justify-center">
                    <Globe className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                )}
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" title={link.title}>
                        {link.title}
                      </h3>
                      {link.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {new URL(link.url).hostname}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </a>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteClick(link);
                }}
                data-testid={`button-delete-link-${link.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("home.favoriteLinks.addLink")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("home.favoriteLinks.siteUrl")}
              </label>
              <Input
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                data-testid="input-favorite-link-url"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("home.favoriteLinks.urlHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddLink}
              disabled={!urlInput.trim() || fetching || createMutation.isPending}
              data-testid="button-confirm-add-link"
            >
              {(fetching || createMutation.isPending) && (
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
            <AlertDialogTitle>{t("home.favoriteLinks.deleteLink")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("home.favoriteLinks.deleteConfirmation", { title: linkToDelete?.title })}
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
