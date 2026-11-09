import { Button } from '#components/ui/button';
import PageTitle from './PageTitle.jsx';
import SearchInput from './SearchInput.jsx';

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
          <PageTitle>
            {title}
          </PageTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        <Button
          className="h-11 w-full rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary-hover sm:w-auto"
          onClick={onAction}
          type="button"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          {actionLabel}
        </Button>
      </header>

      <SearchInput
        className="max-w-xl"
        id="management-search"
        label={searchLabel}
        onChange={onSearchChange}
        placeholder={`Buscar ${searchLabel.toLowerCase()}…`}
        value={searchValue}
      />

      {children}
    </section>
  );
}
