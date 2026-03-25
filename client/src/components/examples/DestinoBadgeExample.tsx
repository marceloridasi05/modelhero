import DestinoBadge from '../DestinoBadge';

export default function DestinoBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <DestinoBadge destino="em_exposicao" />
      <DestinoBadge destino="vendido" />
      <DestinoBadge destino="doado" />
      <DestinoBadge destino="descartado" />
    </div>
  );
}
