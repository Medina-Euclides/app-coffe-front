import { Sprout } from 'lucide-react';

export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d7e0d4] bg-white px-5 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf3e9] text-[#426b48]">
        <Sprout aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-[#294533]">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#748074]">
        {description}
      </p>
    </div>
  );
}
