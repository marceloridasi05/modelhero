import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Mail, Lock } from "lucide-react";
import logoImg from "@assets/modelhero-logo7_1765889827932.png";
import { useLanguage } from "@/contexts/LanguageContext";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export default function Register() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const getCurrentLanguageCode = () => {
    const lang = i18n.language || 'pt';
    return lang.split('-')[0];
  };
  
  const getLoginLink = () => {
    const path = window.location.pathname;
    if (path.includes('/register/en') || path.includes('/en/register')) return '/login/en';
    if (path.includes('/register/es') || path.includes('/es/register')) return '/login/es';
    return '/login';
  };
  
  const getTermsLink = () => {
    const path = window.location.pathname;
    if (path.includes('/register/en') || path.includes('/en/register')) return 'https://modelhero.app/termos_de_uso_en/';
    if (path.includes('/register/es') || path.includes('/es/register')) return 'https://modelhero.app/termos_uso_es/';
    return 'https://modelhero.app/termos_uso/';
  };
  
  const getPrivacyLink = () => {
    const path = window.location.pathname;
    if (path.includes('/register/en') || path.includes('/en/register')) return 'https://modelhero.app/politica_privacidade_en/';
    if (path.includes('/register/es') || path.includes('/es/register')) return 'https://modelhero.app/politica_privacidade_es/';
    return 'https://modelhero.app/politica_privacidade/';
  };

  const registerSchema = z.object({
    name: z.string().min(1, t('auth.validation.nameRequired')),
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordMin')),
    confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: t('auth.validation.termsRequired'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsMismatch'),
    path: ["confirmPassword"],
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const registrationLanguage = getCurrentLanguageCode();
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        registrationLanguage,
      });
      return response.json();
    },
    onSuccess: async (userData) => {
      queryClient.clear();
      sessionStorage.removeItem('previousTotalCount');
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: t('auth.accountCreated'),
        description: t('auth.welcomeToModelHero'),
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.registerError'),
        description: error.message || t('auth.couldNotCreateAccount'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src={logoImg} alt="ModelHero" className="h-[3.8rem] w-auto" data-testid="img-logo-register" />
          </div>
          <CardTitle className="text-2xl font-semibold" data-testid="text-register-title">
            {t('auth.createAccount')}
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            {t('auth.registerSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.name')} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={t('auth.namePlaceholder')}
                          className="pl-10"
                          data-testid="input-name"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-name" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')} *</FormLabel>
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
                    <FormLabel>{t('auth.password')} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={t('auth.passwordMinPlaceholder')}
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.confirmPassword')} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={t('auth.confirmPasswordPlaceholder')}
                          className="pl-10"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-confirm-password" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptedTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        {t('auth.termsText', 'Concordo com os')}{" "}
                        <a
                          href={getTermsLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-foreground underline"
                          data-testid="link-terms"
                        >
                          {t('auth.termsOfUse', 'Termos de Uso')}
                        </a>{" "}
                        {t('auth.and', 'e a')}{" "}
                        <a
                          href={getPrivacyLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-foreground underline"
                          data-testid="link-privacy"
                        >
                          {t('auth.privacyPolicy', 'Política de Privacidade')}
                        </a>
                        {t('auth.experimentalNotice', ', ciente de que o aplicativo está em fase experimental.')}
                      </FormLabel>
                      <FormMessage data-testid="error-terms" />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? t('auth.creatingAccount') : t('auth.createMyFreeAccount')}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.hasAccount')}</span>{" "}
            <Link href={getLoginLink()} className="text-accent-foreground underline" data-testid="link-login">
              {t('auth.doLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
