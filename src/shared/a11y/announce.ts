type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function announce(message: string): void {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
