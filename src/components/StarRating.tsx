"use client";

export default function StarRating({
  valore,
  onChange,
  leggibile = false,
}: {
  valore: number | null;
  onChange?: (v: number) => void;
  leggibile?: boolean;
}) {
  const stelle = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-0.5">
      {stelle.map((s) => (
        <button
          key={s}
          type="button"
          disabled={leggibile}
          onClick={() => onChange?.(s)}
          className={`text-lg leading-none ${leggibile ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"} ${
            valore && s <= valore ? "text-accent" : "text-border"
          }`}
          aria-label={`${s} stelle`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
