// utils/debounce.ts
/**
 * Lightweight debounce utility.
 * Returns a debounced function and exposes a flush method for immediate execution.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { flush?: () => void; cancel?: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  debounced.cancel = debounced.flush;

  return debounced as T & { flush?: () => void; cancel?: () => void };
}