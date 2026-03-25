import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Package, ExternalLink, MessageSquare } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { WishlistPhoto, PurchaseLink } from "@/pages/Wishlist";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  scale: string;
  currentPrice: number;
  purchaseLinks: PurchaseLink[];
  comments: string;
  photos: WishlistPhoto[];
}

interface WishlistListItemProps {
  item: WishlistItem;
  onEdit: () => void;
  onDelete: () => void;
}

export default function WishlistListItem({
  item,
  onEdit,
  onDelete,
}: WishlistListItemProps) {
  const { t } = useTranslation();
  const { convert, formatCurrency, preferredCurrency } = useCurrency();
  const boxCover = item.photos.find((p: WishlistPhoto) => p.isBoxCover) || item.photos[0];
  const convertedPrice = convert(item.currentPrice, "BRL", preferredCurrency);

  return (
    <Card className="hover-elevate overflow-visible" data-testid={`wishlist-list-item-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {boxCover ? (
            <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img
                src={boxCover.url}
                alt={item.name}
                className="w-full h-full object-cover"
                data-testid={`img-wishlist-thumb-${item.id}`}
              />
            </div>
          ) : (
            <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate" data-testid={`text-wishlist-name-${item.id}`}>
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.brand} | {item.scale}
                </p>
                
                {item.currentPrice > 0 && (
                  <p className="text-sm font-medium text-secondary mt-1" data-testid={`text-wishlist-price-${item.id}`}>
                    {formatCurrency(convertedPrice, preferredCurrency)}
                  </p>
                )}
              </div>
              
              <div className="flex gap-1 sm:hidden">
                <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} data-testid={`button-edit-wishlist-${item.id}`}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} data-testid={`button-delete-wishlist-${item.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {item.purchaseLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {item.purchaseLinks.length === 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid={`button-view-link-${item.id}`}
                  >
                    <a
                      href={item.purchaseLinks[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      {t("wishlist.viewLink")}: {item.purchaseLinks[0].name}
                    </a>
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" data-testid={`button-view-links-${item.id}`}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        {t("wishlist.viewLinks")} ({item.purchaseLinks.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {item.purchaseLinks.map((link: PurchaseLink) => (
                        <DropdownMenuItem key={link.id} asChild>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`wishlist-link-${link.id}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {link.name}
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
            
            {item.comments && (
              <div className="flex items-start gap-2 mt-2">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground line-clamp-2">{item.comments}</p>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-start gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} data-testid={`button-edit-wishlist-desktop-${item.id}`}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} data-testid={`button-delete-wishlist-desktop-${item.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
