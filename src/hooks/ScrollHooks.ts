import { useEffect, useRef } from 'react'

export const useInViewTrigger = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback()
            // Optionally, unobserve the element after the callback is triggered
            // observer.unobserve(ref.current!)
          }
        })
      },
      {
        // Adjust the rootMargin as needed to trigger the callback earlier or later
        rootMargin: '0px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [callback])

  return ref
}
