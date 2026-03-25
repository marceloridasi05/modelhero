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

const APP_URL = "https://modelhero.replit.app?lang=es&currency=EUR";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

const registerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme su contraseña"),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
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

export default function WidgetRegisterES() {
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
        registrationLanguage: "es",
      });
      return response.json();
    },
    onSuccess: async () => {
      setRegistrationSuccess(true);
      toast({
        title: "Cuenta creada con éxito!",
        description: "Abriendo ModelHero en nueva pestaña...",
      });
      window.open(APP_URL, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear cuenta",
        description: error.message || "No fue posible crear su cuenta. Inténtelo de nuevo.",
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
            <img src={logoImg} alt="ModelHero" className="h-10 w-auto" data-testid="img-logo-widget-es-success" />
          </div>
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-success-title-es">
            Cuenta creada con éxito!
          </h1>
          <p className="text-muted-foreground text-sm">
            Su cuenta fue creada. Haga clic en el botón para acceder a ModelHero.
          </p>
          <Button
            onClick={handleOpenApp}
            className="w-full bg-accent text-accent-foreground"
            data-testid="button-open-app-es"
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
            <img src={logoImg} alt="ModelHero" className="h-10 w-auto" data-testid="img-logo-widget-es" />
          </div>
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-widget-title-es">
            Crea tu cuenta gratis
          </h1>
          <p className="text-muted-foreground text-sm">
            Organiza tus kits de modelismo
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Nombre *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Tu nombre"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-name-widget-es"
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
                  <FormLabel className="text-sm">Correo electrónico *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-email-widget-es"
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
                  <FormLabel className="text-sm">Contraseña *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-password-widget-es"
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
                  <FormLabel className="text-sm">Confirmar contraseña *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Escriba la contraseña nuevamente"
                        className="pl-10 bg-white dark:bg-white text-black"
                        data-testid="input-confirm-password-widget-es"
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
                      data-testid="checkbox-terms-widget-es"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-normal cursor-pointer">
                      Acepto los{" "}
                      <a
                        href="https://modelhero.app/termos_uso_es/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-foreground underline"
                      >
                        Términos de Uso
                      </a>{" "}
                      y la{" "}
                      <a
                        href="https://modelhero.app/politica_privacidade_es/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-foreground underline"
                      >
                        Política de Privacidad
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
              data-testid="button-register-widget-es"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear mi cuenta gratis"
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <a href="https://modelhero.replit.app/login/es" target="_blank" rel="noopener noreferrer" className="text-accent-foreground underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}
