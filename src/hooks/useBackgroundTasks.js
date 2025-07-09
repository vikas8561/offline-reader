import { useCallback } from 'react';

export function useBackgroundTasks() {
  const scheduleTask = useCallback((task, options = {}) => {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(task, options);
    } else {
      return setTimeout(task, 1);
    }
  }, []);

  const cancelTask = useCallback((taskId) => {
    if ('cancelIdleCallback' in window) {
      cancelIdleCallback(taskId);
    } else {
      clearTimeout(taskId);
    }
  }, []);

  const scheduleCriticalTask = useCallback((task) => {
    if ('requestAnimationFrame' in window) {
      return requestAnimationFrame(task);
    } else {
      return setTimeout(task, 16);
    }
  }, []);

  return {
    scheduleTask,
    cancelTask,
    scheduleCriticalTask
  };
} 