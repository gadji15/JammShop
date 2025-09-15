"use client"

import * as React from "react"
import useEmblaCarousel, { type EmblaOptionsType } from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CarouselProps {
  options?: EmblaOptionsType
  className?: string
  children: React.ReactNode
}

export function Carousel({ options, className, children }: CarouselProps) {
  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    slidesToScroll: 1,
    ...options,
  })

  const scrollPrev = React.useCallback(() => embla?.scrollPrev(), [embla])
  const scrollNext = React.useCallback(() => embla?.scrollNext(), [embla])

  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback(() => {
    if (!embla) return
    setCanScrollPrev(embla.canScrollPrev())
    setCanScrollNext(embla.canScrollNext())
  }, [embla])

  React.useEffect(() => {
    if (!embla) return
    onSelect()
    embla.on("reInit", onSelect)
    embla.on("select", onSelect)
  }, [embla, onSelect])

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden" ref={viewportRef}>
        <div className="flex gap-4">{children}</div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="pointer-events-auto h-8 w-8 md:h-9 md:w-9 bg-white/80 backdrop-blur hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="pointer-events-auto h-8 w-8 md:h-9 md:w-9 bg-white/80 backdrop-blur hover:bg-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface CarouselItemProps {
  className?: string
  children: React.ReactNode
}

export function CarouselItem({ className, children }: CarouselItemProps) {
  return <div className={cn("min-w-0", className)}>{children}</div>
}