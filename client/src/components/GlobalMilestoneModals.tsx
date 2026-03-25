import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { FifthItemModal } from "@/components/FifthItemModal";
import { SeventhItemModal } from "@/components/SeventhItemModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Rocket } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

interface UsageData {
  kitsCount: number;
  materialsCount: number;
  wishlistCount: number;
  totalItems: number;
  limit: number | null;
  hasUnlimitedAccess: boolean;
  canAddItem: boolean;
  canExport: boolean;
}

export function GlobalMilestoneModals() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  const [thirdModalOpen, setThirdModalOpen] = useState(false);
  const [fifthModalOpen, setFifthModalOpen] = useState(false);
  const [seventhModalOpen, setSeventhModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lastProcessedCount, setLastProcessedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!usage || typeof usage.totalItems !== 'number') return;

    const currentTotal = usage.totalItems;
    const storedPrev = sessionStorage.getItem('previousTotalCount');
    const prevTotal = storedPrev !== null ? parseInt(storedPrev, 10) : null;
    
    const thirdShown = sessionStorage.getItem('thirdKitModalShown') === 'true';
    const fifthShown = sessionStorage.getItem('fifthItemModalShown') === 'true';
    const seventhShown = sessionStorage.getItem('seventhItemModalShown') === 'true';

    if (lastProcessedCount === currentTotal) return;

    if (prevTotal === null) {
      // On first load of session, only show modals if user is AT the milestone (not way past it)
      // This prevents showing 3rd item modal to users with 100+ items
      if (currentTotal === 3 && !thirdShown) {
        setThirdModalOpen(true);
        sessionStorage.setItem('thirdKitModalShown', 'true');
      } else if (currentTotal === 5 && !fifthShown) {
        setFifthModalOpen(true);
        sessionStorage.setItem('fifthItemModalShown', 'true');
      } else if (currentTotal === 7 && !seventhShown) {
        setSeventhModalOpen(true);
        sessionStorage.setItem('seventhItemModalShown', 'true');
      }
    } else if (currentTotal > prevTotal) {
      if (prevTotal < 3 && currentTotal >= 3 && !thirdShown) {
        setThirdModalOpen(true);
        sessionStorage.setItem('thirdKitModalShown', 'true');
      }

      if (prevTotal < 5 && currentTotal >= 5 && !fifthShown) {
        setFifthModalOpen(true);
        sessionStorage.setItem('fifthItemModalShown', 'true');
      }

      if (prevTotal < 7 && currentTotal >= 7 && !seventhShown) {
        setSeventhModalOpen(true);
        sessionStorage.setItem('seventhItemModalShown', 'true');
      }
    }

    sessionStorage.setItem('previousTotalCount', String(currentTotal));
    setLastProcessedCount(currentTotal);
  }, [usage?.totalItems, lastProcessedCount]);

  const handleOpenForm = () => {
    if (usage && !usage.canAddItem) {
      setUpgradeModalOpen(true);
      return;
    }
    setLocation("/?openForm=true");
  };

  return (
    <>
      <Dialog open={thirdModalOpen} onOpenChange={setThirdModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-third-item-celebration">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Rocket className="w-6 h-6 text-secondary" />
              {t('home.thirdKitModal.title', 'Ótimo avanço')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-base">
              {t('home.thirdKitModal.description', 'Agora o ModelHero começa a enxergar padrões na sua coleção.')}
            </p>
            <p className="text-muted-foreground text-sm">
              {t('home.thirdKitModal.encouragement', 'Cadastre mais 2 itens para ter uma visão completa do que está em andamento, do que vem depois e onde seu tempo está sendo investido.')}
            </p>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              onClick={() => {
                setThirdModalOpen(false);
                handleOpenForm();
              }}
              data-testid="button-third-item-continue"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('home.thirdKitModal.registerNext', 'Cadastrar próximo item')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FifthItemModal
        open={fifthModalOpen}
        onOpenChange={setFifthModalOpen}
        onAddItem={() => {
          setFifthModalOpen(false);
          handleOpenForm();
        }}
      />

      <SeventhItemModal
        open={seventhModalOpen}
        onOpenChange={setSeventhModalOpen}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
    </>
  );
}
