import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Mail, Lock, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import logoImg from "@assets/modelhero-logo7_1765889827932.png";

const APP_URL = "https://modelhero.replit.app?lang=pt&currency=BRL";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua senha"),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar os termos",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

function hideSuperChat() {
  const selectors = [
    '[id*="superchat"]',
    '[class*="superchat"]',
    'iframe[src*="superchat"]',
    '[id*="SuperChat"]',
    '[class*="SuperChat"]',
    'div[style*="z-index"][style*="position: fixed"]',
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el) => {
      const element = el as HTMLElement;
      if (element.id?.toLowerCase().includes('superchat') || 
          element.className?.toString().toLowerCase().includes('superchat') ||
          (element.tagName === 'IFRAME' && (element as HTMLIFrameElement).src?.includes('superchat'))) {
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('opacity', '0', 'important');
      }
    });
  });
  
  document.querySelectorAll('body > div').forEach((el) => {
    const element = el as HTMLElement;
    const style = window.getComputedStyle(element);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 9000) {
      if (!element.closest('#root')) {
        element.style.setProperty('display', 'none', 'important');
      }
    }
  });
}

export default function WidgetRegisterPT() {
  const { toast } = useToast();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    hideSuperChat();
    
    const observer = new MutationObserver(() => {
      hideSuperChat();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    const interval = setInterval(hideSuperChat, 500);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

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
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        registrationLanguage: "pt",
      });
      return response.json();
    },
    onSuccess: async () => {
      setRegistrationSuccess(true);
      toast({
        title: "Conta criada com sucesso!",
        description: "Abrindo o ModelHero em nova aba...",
      });
      window.open(APP_URL, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleOpenApp = () => {
    window.open(APP_URL, "_blank", "noopener,noreferrer");
  };

  if (registrationSuccess) {
    return (
      <div className="flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="flex justify-center mb-3">
            <img src={logoImg} alt="ModelHero" className="h-10 w-auto" data-testid="img-logo-widget-pt-success" />
          </div>
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-success-title-pt">
            Conta criada com sucesso!
          </h1>
          <p className="text-muted-foreground text-sm">
            Sua conta foi criada. Clique no botão abaixo para acessar o ModelHero.
          </p>
          <Button
            onClick={handleOpenApp}
            className="w-full bg-accent text-accent-foreground"
            data-testid="button-open-app-pt"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir ModelHero
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <img src={logoImg} alt="ModelHero" className="h-10 w-auto" data-testid="img-logo-widget-pt" />
          </div>
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-widget-title-pt">
            Crie sua conta grátis
          </h1>
          <p className="text-muted-foreground text-sm">
            Organize seus kits de plastimodelismo
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Nome *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Seu nome"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-name-widget-pt"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">E-mail *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-email-widget-pt"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-password-widget-pt"
                        {...field}
                      />
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
                  <FormLabel className="text-sm">Confirmar senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Digite a senha novamente"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-confirm-password-widget-pt"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
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
                      data-testid="checkbox-terms-widget-pt"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-normal cursor-pointer">
                      Concordo com os{" "}
                      <a
                        href="https://modelhero.app/termos_uso/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-foreground underline"
                      >
                        Termos de Uso
                      </a>{" "}
                      e a{" "}
                      <a
                        href="https://modelhero.app/politica_privacidade/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-foreground underline"
                      >
                        Política de Privacidade
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground"
              disabled={registerMutation.isPending}
              data-testid="button-register-widget-pt"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar minha conta grátis"
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground">
          Já tem uma conta?{" "}
          <a href="https://modelhero.replit.app/login" target="_blank" rel="noopener noreferrer" className="text-accent-foreground underline">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}
