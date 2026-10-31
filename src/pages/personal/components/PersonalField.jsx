import { Input } from '#components/ui/input';

export const personalControlClassName =
  'h-11 rounded-xl border-slate-300 px-3 text-sm text-slate-800';

export function PersonalField({ children, htmlFor, label }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function PersonalInput({ className = '', ...props }) {
  return (
    <Input
      className={`${personalControlClassName} ${className}`}
      {...props}
    />
  );
}

export function PersonalSelect({ children, className = '', ...props }) {
  return (
    <select
      className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:border-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
