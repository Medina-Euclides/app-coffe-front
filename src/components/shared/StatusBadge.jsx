import { Badge } from '#components/ui/badge';

/**
 * Badge de estado con colores consistentes: Activo/Inactivo, Recolección/Labor.
 */
export default function StatusBadge({ children, variant = 'default' }) {
  const styles = {
    active: 'shrink-0 border-border bg-tint text-primary',
    inactive:
      'shrink-0 border-border bg-muted text-muted-foreground',
    harvest: 'border-border bg-muted text-primary',
    labor: 'border-border bg-muted text-primary',
    default: '',
  };

  return (
    <Badge variant="outline" className={styles[variant]}>
      {children}
    </Badge>
  );
}
