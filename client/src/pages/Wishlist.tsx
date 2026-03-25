import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  ShoppingCart,
  Loader2,
  Globe,
  ImageIcon,
} from "lucide-react";
import SearchInput from "@/components/SearchInput";
import WishlistListItem from "@/components/WishlistListItem";
import UpgradeModal from "@/components/UpgradeModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WishlistItem } from "@shared/schema";

export interface WishlistPhoto {
  id: string;
  url: string;
  isBoxCover: boolean;
}

export interface PurchaseLink {
  id: string;
  name: string;
  url: string;
}

interface WishlistFormData {
  name: string;
  brand: string;
  scale: string;
  currentPrice: string;
  purchaseLinks: PurchaseLink[];
  comments: string;
  photos: WishlistPhoto[];
}

interface UsageData {
  kitsCount: number;
  materialsCount: number;
  wishlistCount: number;
  totalCount: number;
  limit: number;
  hasUnlimitedAccess: boolean;
  canAddItem: boolean;
  canExport: boolean;
}

const emptyFormData: WishlistFormData = {
  name: "",
  brand: "",
  scale: "",
  currentPrice: "",
  purchaseLinks: [],
  comments: "",
  photos: [],
};

export default function Wishlist() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [formData, setFormData] = useState<WishlistFormData>(emptyFormData);
  const [newLink, setNewLink] = useState({ name: "", url: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isExtractingFromUrl, setIsExtractingFromUrl] = useState(false);

  // Fetch wishlist items
  const { data: items = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
  });

  // Fetch usage data
  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<WishlistItem, "id" | "userId" | "createdAt">) => {
      const response = await apiRequest("POST", "/api/wishlist", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "LIMIT_EXCEEDED") {
          throw new Error("LIMIT_EXCEEDED");
        }
        throw new Error(errorData.message || t("wishlist.toasts.errorAdding"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({ title: t("wishlist.toasts.kitAdded") });
      handleCloseForm();
    },
    onError: (error: Error) => {
      if (error.message === "LIMIT_EXCEEDED") {
        setUpgradeModalOpen(true);
        return;
      }
      toast({ title: t("wishlist.toasts.errorAdding"), variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WishlistItem> }) => {
      const response = await apiRequest("PATCH", `/api/wishlist/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t("wishlist.toasts.errorUpdating"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: t("wishlist.toasts.kitUpdated") });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({ title: t("wishlist.toasts.errorUpdating"), description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/wishlist/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t("wishlist.toasts.errorRemoving"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({ title: t("wishlist.toasts.kitRemoved") });
    },
    onError: () => {
      toast({ title: t("wishlist.toasts.errorRemoving"), variant: "destructive" });
    },
  });

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.brand?.toLowerCase().includes(searchLower)) ||
        (item.scale?.toLowerCase().includes(searchLower)) ||
        (item.comments?.toLowerCase().includes(searchLower))
    );
  }, [items, search]);

  const handleOpenForm = (item?: WishlistItem) => {
    // Check limit when adding new item
    if (!item && !usage?.canAddItem) {
      setUpgradeModalOpen(true);
      return;
    }

    if (item) {
      setEditingItem(item);
      const purchaseLinks = (item.purchaseLinks as PurchaseLink[]) || [];
      const photos = (item.photos as WishlistPhoto[]) || [];
      setFormData({
        name: item.name,
        brand: item.brand || "",
        scale: item.scale || "",
        currentPrice: item.currentPrice?.toString() || "",
        purchaseLinks,
        comments: item.comments || "",
        photos,
      });
    } else {
      setEditingItem(null);
      setFormData(emptyFormData);
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingItem(null);
    setFormData(emptyFormData);
    setNewLink({ name: "", url: "" });
    setUrlInput("");
  };

  const handleExtractFromUrl = async () => {
    if (!urlInput.trim()) return;
    
    setIsExtractingFromUrl(true);
    try {
      const response = await fetch("/api/ai/extract-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: urlInput.trim(), formType: "wishlist" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.name) setFormData(prev => ({ ...prev, name: data.name }));
        if (data.brand) setFormData(prev => ({ ...prev, brand: data.brand }));
        if (data.scale) setFormData(prev => ({ ...prev, scale: data.scale }));
        if (data.currentPrice) setFormData(prev => ({ ...prev, currentPrice: data.currentPrice.toString() }));
        
        const fieldsFound = [
          data.name && `${t("common.name")}: ${data.name}`,
          data.brand && `${t("common.brand")}: ${data.brand}`,
          data.scale && `${t("common.scale")}: ${data.scale}`,
          data.currentPrice && `${t("common.price")}: ${data.currentPrice}`,
        ].filter(Boolean);
        
        toast({
          title: t("wishlist.toasts.dataExtracted"),
          description: fieldsFound.length > 0
            ? fieldsFound.join(", ")
            : t("wishlist.toasts.noDataFound"),
        });
        setUrlInput("");
      } else {
        toast({
          title: t("wishlist.toasts.errorExtracting"),
          description: t("wishlist.toasts.couldNotExtract"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("wishlist.toasts.serverConnectionError"),
        variant: "destructive",
      });
    } finally {
      setIsExtractingFromUrl(false);
    }
  };

  const handleAddLink = () => {
    if (newLink.name && newLink.url) {
      setFormData({
        ...formData,
        purchaseLinks: [
          ...formData.purchaseLinks,
          { id: crypto.randomUUID(), name: newLink.name, url: newLink.url },
        ],
      });
      setNewLink({ name: "", url: "" });
    }
  };

  const handleRemoveLink = (id: string) => {
    setFormData({
      ...formData,
      purchaseLinks: formData.purchaseLinks.filter((link) => link.id !== id),
    });
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    e.target.value = "";

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch("/api/wishlist/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { url } = await response.json();
        const newPhoto: WishlistPhoto = {
          id: crypto.randomUUID(),
          url,
          isBoxCover: true,
        };

        setFormData((prev) => ({
          ...prev,
          photos: [newPhoto],
        }));
        setIsUploadingPhoto(false);
      };
      reader.onerror = () => {
        setIsUploadingPhoto(false);
        toast({ title: t("wishlist.toasts.errorAdding"), variant: "destructive" });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingPhoto(false);
      toast({ title: t("wishlist.toasts.errorAdding"), variant: "destructive" });
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, photos: [] });
  };

  const handleSave = () => {
    if (!formData.name || !formData.brand || !formData.scale) return;

    // Re-check limit at submit time for new items
    if (!editingItem && !usage?.canAddItem) {
      handleCloseForm();
      setUpgradeModalOpen(true);
      return;
    }

    const itemData = {
      name: formData.name,
      brand: formData.brand,
      scale: formData.scale,
      currentPrice: parseFloat(formData.currentPrice) || 0,
      purchaseLinks: formData.purchaseLinks,
      comments: formData.comments,
      photos: formData.photos,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const handleDeleteClick = (item: WishlistItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setItemToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-20 md:pb-6" data-testid="page-wishlist">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t("wishlist.title")}</h1>
          <p className="text-muted-foreground">
            {t(items.length !== 1 ? "wishlist.subtitle_plural" : "wishlist.subtitle", { filtered: filteredItems.length, total: items.length })}
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => handleOpenForm()}
          data-testid="button-add-wishlist"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("wishlist.newKit")}
        </Button>
      </div>

      <SearchInput 
        value={search} 
        onChange={setSearch} 
        placeholder={t("wishlist.searchPlaceholder")}
      />

      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <WishlistListItem
              key={item.id}
              item={{
                id: String(item.id),
                name: item.name,
                brand: item.brand || "",
                scale: item.scale || "",
                currentPrice: item.currentPrice || 0,
                purchaseLinks: (item.purchaseLinks as PurchaseLink[]) || [],
                comments: item.comments || "",
                photos: (item.photos as WishlistPhoto[]) || [],
              }}
              onEdit={() => handleOpenForm(item)}
              onDelete={() => handleDeleteClick(item)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">
            {search
              ? t("wishlist.noItemsFound")
              : t("wishlist.noItems")}
          </p>
          <p className="text-sm">
            {search
              ? t("wishlist.tryAdjustSearch")
              : t("wishlist.noItemsHint")}
          </p>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden" data-testid="wishlist-form-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t("wishlist.editItem") : t("wishlist.registerItem")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem ? t("wishlist.editItem") : t("wishlist.registerItem")}
            </DialogDescription>
          </DialogHeader>

          {!editingItem && (
            <div className="flex gap-2">
              <Input
                placeholder={t("wishlist.urlPlaceholder")}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExtractFromUrl()}
                className="flex-1 min-w-0"
                data-testid="input-wishlist-url"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleExtractFromUrl}
                disabled={isExtractingFromUrl || !urlInput.trim()}
                data-testid="button-extract-wishlist-url"
              >
                {isExtractingFromUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          <div className="space-y-4 overflow-hidden">
            <div className="space-y-2">
              <Label htmlFor="wishlist-name">{t("wishlist.form.kitName")}</Label>
              <Input
                id="wishlist-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("wishlist.form.kitNamePlaceholder")}
                data-testid="input-wishlist-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wishlist-brand">{t("wishlist.form.brand")}</Label>
                <Input
                  id="wishlist-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder={t("wishlist.form.brandPlaceholder")}
                  data-testid="input-wishlist-brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wishlist-scale">{t("wishlist.form.scale")}</Label>
                <Select 
                  value={formData.scale} 
                  onValueChange={(value) => setFormData({ ...formData, scale: value })}
                >
                  <SelectTrigger data-testid="select-wishlist-scale">
                    <SelectValue placeholder={t("wishlist.form.scalePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1/6">1/6</SelectItem>
                    <SelectItem value="1/12">1/12</SelectItem>
                    <SelectItem value="1/24">1/24</SelectItem>
                    <SelectItem value="1/32">1/32</SelectItem>
                    <SelectItem value="1/35">1/35</SelectItem>
                    <SelectItem value="1/48">1/48</SelectItem>
                    <SelectItem value="1/50">1/50</SelectItem>
                    <SelectItem value="1/72">1/72</SelectItem>
                    <SelectItem value="1/100">1/100</SelectItem>
                    <SelectItem value="1/144">1/144</SelectItem>
                    <SelectItem value="1/350">1/350</SelectItem>
                    <SelectItem value="1/700">1/700</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wishlist-price">{t("wishlist.form.currentPrice")}</Label>
              <Input
                id="wishlist-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                placeholder="0,00"
                data-testid="input-wishlist-price"
              />
            </div>

            <div className="space-y-2 overflow-hidden">
              <Label>{t("wishlist.form.purchaseLinks")}</Label>
              <div className="space-y-2">
                {formData.purchaseLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 overflow-hidden"
                  >
                    <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium truncate">{link.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveLink(link.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="space-y-2">
                  <Input
                    placeholder={t("wishlist.form.linkNamePlaceholder")}
                    value={newLink.name}
                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    data-testid="input-link-name"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("wishlist.form.linkUrlPlaceholder")}
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      className="flex-1 min-w-0"
                      data-testid="input-link-url"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddLink}
                      className="flex-shrink-0"
                      data-testid="button-add-link"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wishlist-comments">{t("wishlist.form.comments")}</Label>
              <Textarea
                id="wishlist-comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder={t("wishlist.form.commentsPlaceholder")}
                rows={3}
                data-testid="input-wishlist-comments"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("wishlist.form.photos")}</Label>
              {formData.photos.length > 0 ? (
                <div className="flex items-start gap-3">
                  <div className="relative w-32 h-24 rounded-md overflow-hidden bg-muted">
                    <img
                      src={formData.photos[0].url}
                      alt={t("wishlist.form.photoAlt")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRemovePhoto}
                      data-testid="button-remove-wishlist-photo"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t("common.delete")}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {t("wishlist.form.photoDeleteHint")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-md">
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-8 h-8 text-muted-foreground/50 mb-2 animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        {t("common.loading")}...
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        {t("wishlist.form.noPhotoYet")}
                      </p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          data-testid="input-wishlist-photos"
                        />
                        <Button size="sm" variant="secondary" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-1" />
                            {t("common.upload")}
                          </span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.brand || !formData.scale || createMutation.isPending || updateMutation.isPending || isUploadingPhoto}
              data-testid="button-save-wishlist"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingItem ? t("common.save") : t("nav.register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-wishlist-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("wishlist.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("wishlist.delete.confirmation", { name: itemToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-wishlist">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-wishlist"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  );
}
