// Modal de formulario: título, campos, aviso de error y botones Cancelar / Guardar.
// Maneja el "Guardando…" y los errores: `onSubmit` devuelve un mensaje de error
// (string) para mostrar, `false` si ya marcó un campo con error (el modal sigue
// abierto), o '' / nada si todo salió bien y el modal se cierra.
//
//   const feedback = useFormFeedback();
//   <FormDialog feedback={feedback} onSubmit={() => onSave(datos)} submitLabel="Guardar finca" …>
//     <TextField feedback={feedback} id="farm-name" … />
//   </FormDialog>
//
// size="lg": formularios largos (jornadas), más anchos y con separadores.
// status: lo que se muestra en lugar del formulario mientras carga o si falló la carga.
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { FormAlert } from '#components/shared/FormFeedback';
import { cn } from '#lib/utils';

const sizes = {
  default: {
    content: 'p-5 sm:max-w-lg sm:p-6',
    header: 'pr-8',
    title: 'text-2xl text-foreground',
    footer: 'flex-col-reverse gap-2 sm:flex-row',
  },
  lg: {
    content: 'border-border p-5 sm:max-w-2xl sm:p-7',
    header: 'border-b border-border/60 pb-4 pr-8',
    title: 'text-2xl text-foreground sm:text-[1.75rem]',
    footer: 'flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row',
  },
};

export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  // Si es false, la descripción solo la leen los lectores de pantalla.
  showDescription = true,
  feedback,
  onSubmit,
  submitLabel = 'Guardar',
  submitIcon: SubmitIcon,
  errorFallback = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.',
  disabled = false,
  size = 'default',
  status,
  className,
  formClassName,
  children,
}) {
  const [saving, setSaving] = useState(false);
  const styles = sizes[size] || sizes.default;

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();
    setSaving(true);
    try {
      const result = await onSubmit();
      if (result === false) return;
      if (result) {
        feedback.setFormError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error(`Error al guardar (${title}):`, saveError);
      feedback.setFormError(saveError?.message || errorFallback);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          'max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl',
          styles.content,
          className,
        )}
      >
        <DialogHeader className={styles.header}>
          <DialogTitle className={styles.title}>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={showDescription ? 'leading-6' : 'sr-only'}>
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {status || (
          <form className={cn('space-y-4', formClassName)} {...feedback.formProps} onSubmit={handleSubmit}>
            {children}
            <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />
            <DialogFooter className={styles.footer}>
              <Button
                className={cn('min-h-11 rounded-xl', size === 'lg' && 'text-muted-foreground')}
                disabled={saving}
                onClick={() => onOpenChange(false)}
                type="button"
                variant={size === 'lg' ? 'ghost' : 'outline'}
              >
                Cancelar
              </Button>
              <Button
                className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
                disabled={saving || disabled}
                type="submit"
              >
                {saving ? (
                  SubmitIcon && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  SubmitIcon && <SubmitIcon aria-hidden="true" className="size-4" />
                )}
                {saving ? 'Guardando…' : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
