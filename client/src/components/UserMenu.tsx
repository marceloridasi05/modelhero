import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, KeyRound, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserMenuProps {
  onChangePassword: () => void;
}

export default function UserMenu({ onChangePassword }: UserMenuProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhotoMutation = useMutation({
    mutationFn: async (profilePhoto: string) => {
      const response = await apiRequest("PATCH", "/api/auth/profile", { profilePhoto });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("common.userMenu.photoUpdated") });
      setPhotoDialogOpen(false);
      setPreviewPhoto(null);
    },
    onError: () => {
      toast({ title: t("common.userMenu.photoError"), variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (previewPhoto) {
      updatePhotoMutation.mutate(previewPhoto);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profilePhoto || undefined} alt={user.name} />
              <AvatarFallback className="bg-white/20 md:bg-primary text-white md:text-primary-foreground text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPhotoDialogOpen(true)} data-testid="menu-item-photo">
            <Camera className="mr-2 h-4 w-4" />
            <span>{t("common.userMenu.changePhoto")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onChangePassword} data-testid="menu-item-password">
            <KeyRound className="mr-2 h-4 w-4" />
            <span>{t("common.userMenu.changePassword")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("common.userMenu.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.userMenu.changeProfilePhoto")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={previewPhoto || user.profilePhoto || undefined} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-profile-photo"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-photo"
            >
              <Camera className="mr-2 h-4 w-4" />
              {t("common.userMenu.selectPhoto")}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPhotoDialogOpen(false);
              setPreviewPhoto(null);
            }}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSavePhoto}
              disabled={!previewPhoto || updatePhotoMutation.isPending}
              data-testid="button-save-photo"
            >
              {updatePhotoMutation.isPending ? t("common.userMenu.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
