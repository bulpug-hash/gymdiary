// Sdílený „vrátit zpět" toast. Používají ho všechna tři místa mazání
// (cviky, běhy, HIIT), aby se chovala stejně.
import { toast } from 'sonner';

const UNDO_MS = 6000;

export function undoToast(message: string, onUndo: () => void) {
  toast(message, {
    duration: UNDO_MS,
    action: {
      label: 'Vrátit zpět',
      onClick: onUndo,
    },
  });
}
