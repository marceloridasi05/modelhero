import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Lock, HelpCircle } from "lucide-react";
import logoImg from "@assets/modelhero-logo7_1765889827932.png";

type LoginFormData = {
  email: string;
  password: string;
};

export default function Login() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  
  const getRegisterLink = () => {
    const path = window.location.pathname;
    if (path.includes('/login/en') || path.includes('/en/login')) return '/register/en';
    if (path.includes('/login/es') || path.includes('/es/login')) return '/register/es';
    return '/register';
  };

  const loginSchema = z.object({
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  });
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (userData) => {
      queryClient.clear();
      sessionStorage.removeItem('previousTotalCount');
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: t('auth.welcomeBack'),
        description: t('auth.loginSuccess'),
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.loginError'),
        description: error.message || t('auth.invalidCredentials'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src={logoImg} alt="ModelHero" className="h-[3.8rem] w-auto" data-testid="img-logo-login" />
          </div>
          <CardTitle className="text-2xl font-semibold" data-testid="text-login-title">
            {t('auth.login')}
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            {t('auth.loginSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
                          className="pl-10"
                          data-testid="input-email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-email" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={t('auth.passwordPlaceholder')}
                          className="pl-10"
                          data-testid="input-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-password" />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-accent-foreground/70 hover:text-accent-foreground underline"
                  data-testid="link-forgot-password"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? t('auth.loggingIn') : t('auth.login')}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.noAccount')}{" "}
              <Link
                href={getRegisterLink()}
                className="text-accent-foreground font-medium underline"
                data-testid="link-register"
              >
                {t('auth.createFreeAccount')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {t('auth.recoverPassword')}
            </DialogTitle>
            <DialogDescription>
              {t('auth.recoverPasswordDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t('auth.sendEmailTo')}</p>
            <p className="font-medium text-foreground">marceloribeiro.pro@gmail.com</p>
            <p>{t('auth.informYourEmail')}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setForgotPasswordOpen(false)} data-testid="button-close-forgot-password">
              {t('auth.understood')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
