import { Search } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

export default function ManagementPage({
  title,
  description,
  actionLabel,
  onAction,
  searchLabel,
  searchValue,
  onSearchChange,
  children,
}) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-[#183d2b] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68766b] sm:text-base">
            {description}
          </p>
        </div>
        <Button
          className="h-11 w-full rounded-xl bg-[#214b32] px-4 text-white hover:bg-[#173d2b] sm:w-auto"
          onClick={onAction}
          type="button"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          {actionLabel}
        </Button>
      </header>

      <div className="relative max-w-xl">
        <label className="sr-only" htmlFor="management-search">
          {searchLabel}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7b887c]"
        />
        <Input
          autoComplete="off"
          className="h-11 rounded-xl border-[#dfe5dc] bg-white pl-10 text-base shadow-sm placeholder:text-[#899489] focus-visible:border-[#5b805e] focus-visible:ring-[#5b805e]/20"
          id="management-search"
          name="search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Buscar ${searchLabel.toLowerCase()}…`}
          type="search"
          value={searchValue}
        />
      </div>

      {children}
    </section>
  );
}
