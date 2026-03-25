import StatCard from '../StatCard';
import { Package } from 'lucide-react';

export default function StatCardExample() {
  return <StatCard title="Total de Kits" value={42} icon={Package} highlight />;
}
