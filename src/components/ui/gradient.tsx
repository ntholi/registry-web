import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
} & PropsWithChildren;

export default function Gradient({ children, className }: Props) {
  return (
    <div
      className={cn(
        'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] via-20% to-60% from-slate-900 via-slate-950 to-black',
        className
      )}
    >
      {children}
    </div>
  );
}
