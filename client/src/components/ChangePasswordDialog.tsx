import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Eye, EyeOff } from "lucide-react";

type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isNewUser?: boolean;
}

export function ChangePasswordDialog({ open, onOpenChange, isNewUser = false }: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordSchema = useMemo(() => z.object({
    currentPassword: z.string().min(1, t("common.changePassword.validation.currentRequired")),
    newPassword: z.string().min(6, t("common.changePassword.validation.minLength")),
    confirmPassword: z.string().min(1, t("common.changePassword.validation.confirmRequired")),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t("common.changePassword.validation.mismatch"),
    path: ["confirmPassword"],
  }), [t]);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (open && isNewUser) {
      form.setValue("currentPassword", "123456");
    } else if (open && !isNewUser) {
      form.setValue("currentPassword", "");
    }
  }, [open, isNewUser, form]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.changePassword.successTitle"),
        description: t("common.changePassword.successDescription"),
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.changePassword.errorTitle"),
        description: error.message || t("common.changePassword.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("common.changePassword.title")}</DialogTitle>
          <DialogDescription>
            {isNewUser 
              ? t("common.changePassword.descriptionNewUser")
              : t("common.changePassword.descriptionExisting")
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.changePassword.currentPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder={isNewUser ? "123456" : t("common.changePassword.currentPasswordPlaceholder")}
                        className="pl-10 pr-10"
                        data-testid="input-current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.changePassword.newPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t("common.changePassword.newPasswordPlaceholder")}
                        className="pl-10 pr-10"
                        data-testid="input-new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.changePassword.confirmPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("common.changePassword.confirmPasswordPlaceholder")}
                        className="pl-10 pr-10"
                        data-testid="input-confirm-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-password"
              >
                {isNewUser ? t("common.changePassword.changeLater") : t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                data-testid="button-submit-password"
              >
                {changePasswordMutation.isPending ? t("common.changePassword.changing") : t("common.changePassword.changeButton")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
