import KitCard from '../KitCard';

// todo: remove mock functionality
const mockKit = {
  id: "1",
  name: "F-16 Fighting Falcon",
  brand: "Tamiya",
  scale: "1/48",
  type: "Avião",
  status: "em_andamento" as const,
  destino: "nenhum" as const,
  rating: 8,
  paidValue: 250,
  currentValue: 320,
  hoursWorked: 12,
  progress: 45,
};

export default function KitCardExample() {
  return <KitCard kit={mockKit} onEdit={(kit) => console.log('Edit kit:', kit.name)} />;
}
