export const debounce = (
  f: (...args: unknown[]) => unknown,
  wait: number,
  immediate: boolean = true
) => {
  let timeout: NodeJS.Timeout | undefined = undefined;
  return () => {
    clearTimeout(timeout);
    if (immediate && !timeout) {
      f();
    }

    timeout = setTimeout(() => {
      timeout = undefined;
      if (!immediate) {
        f();
      }
    }, wait);
  };
};
