// frontend/src/utils/debounce.ts
/**
 * Lightweight debounce utility.
 * Returns a debounced function and exposes flush and cancel methods for immediate execution or cleanup.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { flush?: () => void; cancel?: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
      lastArgs = null;
    }, delay);
  };

  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      fn(...lastArgs);
      timer = null;
      lastArgs = null;
    }
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      lastArgs = null;
    }
  };

  return debounced as T & { flush?: () => void; cancel?: () => void };
}
