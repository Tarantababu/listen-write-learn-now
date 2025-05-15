
/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Whether to invoke the function on the leading edge instead of trailing edge
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let resolveList: Array<(value: ReturnType<T> | undefined) => void> = [];

  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T> | undefined> {
    const context = this;
    
    return new Promise<ReturnType<T> | undefined>((resolve) => {
      resolveList.push(resolve);
      
      const later = function() {
        timeout = null;
        if (!immediate) {
          const result = func.apply(context, args);
          resolveList.forEach(resolveFunc => resolveFunc(result));
          resolveList = [];
        }
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(later, wait);
      
      if (callNow) {
        const result = func.apply(context, args);
        resolveList.forEach(resolveFunc => resolveFunc(result));
        resolveList = [];
      }
    });
  };
}
