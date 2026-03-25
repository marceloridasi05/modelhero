import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface UploadLoadingModalProps {
  open: boolean;
  message?: string;
}

export default function UploadLoadingModal({ 
  open, 
  message
}: UploadLoadingModalProps) {
  const { t } = useTranslation();
  const displayMessage = message || t("common.uploadLoading");

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xs" data-testid="upload-loading-modal">
        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">{displayMessage}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
