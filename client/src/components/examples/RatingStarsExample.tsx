import RatingStars from '../RatingStars';

export default function RatingStarsExample() {
  return (
    <div className="flex flex-col gap-2">
      <RatingStars rating={8} />
      <RatingStars rating={5} />
      <RatingStars rating={10} />
    </div>
  );
}
