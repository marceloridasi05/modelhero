import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareButtonProps {
  page: "kits" | "kit" | "materials" | "statistics";
  kitId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export default function ShareButton({ page, kitId, variant = "outline", size = "sm" }: ShareButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/user/share-token");
      const data = await res.json();
      const token = data.shareToken;

      let path = `/share/${token}`;
      if (page === "kit" && kitId) {
        path = `/share/${token}/kit/${kitId}`;
      } else if (page === "materials") {
        path = `/share/${token}?tab=materials`;
      } else if (page === "statistics") {
        path = `/share/${token}?tab=statistics`;
      }

      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: t("share.linkCopied", { defaultValue: "Link copied!" }),
        description: t("share.linkCopiedDesc", { defaultValue: "Share this link with anyone to show your collection." }),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Share error:", err);
      toast({
        title: t("share.error", { defaultValue: "Error" }),
        description: t("share.errorDesc", { defaultValue: "Could not generate share link." }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleShare}
          disabled={isLoading}
          data-testid={`button-share-${page}`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {size !== "icon" && (
            <span className="ml-1">
              {copied
                ? t("share.copied", { defaultValue: "Copied!" })
                : t("share.share", { defaultValue: "Share" })}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {t("share.shareTooltip", { defaultValue: "Copy public link to share" })}
      </TooltipContent>
    </Tooltip>
  );
}
