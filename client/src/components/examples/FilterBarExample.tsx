import { useState } from 'react';
import FilterBar from '../FilterBar';
import type { KitStatus } from '../StatusBadge';
import type { KitDestino } from '../DestinoBadge';

export default function FilterBarExample() {
  const [status, setStatus] = useState<KitStatus | "all">("all");
  const [destino, setDestino] = useState<KitDestino | "all">("all");

  return (
    <FilterBar
      statusFilter={status}
      destinoFilter={destino}
      onStatusChange={setStatus}
      onDestinoChange={setDestino}
      onClearFilters={() => {
        setStatus("all");
        setDestino("all");
      }}
    />
  );
}
