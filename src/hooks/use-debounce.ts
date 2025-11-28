import { useCallback, useRef } from "react"

export function useDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number = 500
) {
  const timeoutRef = useRef<number | undefined>()

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}
