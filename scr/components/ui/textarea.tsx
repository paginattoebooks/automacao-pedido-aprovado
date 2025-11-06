import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'border border-gray-300 rounded-md px-3 py-2 w-full min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
