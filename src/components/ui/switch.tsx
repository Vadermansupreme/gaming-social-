import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
  className={cn(
    "peer inline-flex h-4 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 transition-all duration-200 ease-out p-[2px]",
    "data-[state=checked]:bg-emerald-500",
    className
  )}
  {...props}
  ref={ref}
>
    <SwitchPrimitives.Thumb
  className={cn(
    "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-md transition-transform duration-200",
    "data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0"
  )}
/>
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
