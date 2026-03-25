import { useState } from 'react';
import { Button } from '@/components/ui/button';
import KitForm from '../KitForm';

export default function KitFormExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Abrir Formulario
      </Button>
      <KitForm 
        open={open} 
        onOpenChange={setOpen}
        onSave={(kit) => console.log('Kit saved:', kit)}
      />
    </div>
  );
}
