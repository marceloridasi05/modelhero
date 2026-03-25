import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="na_caixa" />
      <StatusBadge status="em_andamento" />
      <StatusBadge status="montado" />
      <StatusBadge status="aguardando_reforma" />
    </div>
  );
}
