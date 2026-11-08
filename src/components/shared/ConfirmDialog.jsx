// Modal de confirmación para acciones que no se deshacen fácilmente (cerrar,
// retirar, desactivar). Se usa con el hook useConfirm.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { cn } from '#lib/utils';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel?.();
      }}
      open={open}
    >
      <AlertDialogContent className="gap-5 rounded-2xl p-5 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl leading-tight text-foreground">{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-base leading-6 text-muted-foreground">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="-mx-5 -mb-5 rounded-b-2xl p-4">
          <AlertDialogCancel className="h-11 rounded-xl px-4 text-base">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              'h-11 rounded-xl px-4 text-base',
              tone === 'danger'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover',
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
