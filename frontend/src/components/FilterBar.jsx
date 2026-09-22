const chips = ["All", "Franchise", "Wholesale", "Resell", "Following"];
export default function FilterBar({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-auto scrollbar-thin pb-2">
      {chips.map(c => {
        const isActive = active === c;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${isActive ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border hover:bg-bg"}`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
