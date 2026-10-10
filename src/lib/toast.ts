export interface Toast {
  id: string;
  title: string;
  message?: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(title: string, message?: string, tone: Toast['tone'] = 'info', ms = 4500) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, title, message, tone }].slice(-4);
  emit();
  setTimeout(() => dismissToast(id), ms);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}
