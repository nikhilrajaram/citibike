export const debounce = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: (...args: any[]) => any,
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
