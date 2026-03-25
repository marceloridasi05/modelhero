import KitListItem from '../KitListItem';

export default function KitListItemExample() {
  return (
    <KitListItem
      id="1"
      name="Panzer IV Ausf. H"
      brand="Tamiya"
      scale="1/35"
      type="Tanque"
      status="montado"
      destino="em_exposicao"
      rating={9}
      paidValue={189.9}
      currentValue={350}
      onEdit={() => console.log('Edit clicked')}
      onDelete={() => console.log('Delete clicked')}
    />
  );
}
