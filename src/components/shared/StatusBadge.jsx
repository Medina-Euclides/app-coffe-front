import { Badge } from '#components/ui/badge';

/**
 * Badge de estado con colores consistentes: Activo/Inactivo, Recolección/Labor.
 */
export default function StatusBadge({ children, variant = 'default' }) {
  const styles = {
    active: 'shrink-0 border-[#d5e8d4] bg-[#edf6eb] text-[#35643b]',
    inactive:
      'shrink-0 border-[#e6e7e2] bg-[#f3f4f1] text-[#687168]',
    harvest: 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]',
    labor: 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]',
    default: '',
  };

  return (
    <Badge variant="outline" className={styles[variant]}>
      {children}
    </Badge>
  );
}
