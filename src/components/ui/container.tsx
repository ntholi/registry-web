import { cn } from '@/lib/utils';
import React from 'react';

type Props = {
  children: React.ReactNode;
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>;

export function Container({ children, as, width = 'lg', ...props }: Props) {
  const widthMap = {
    xs: 'max-w-[30rem]',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return React.createElement(
    as || 'div',
    {
      ...props,
      className: cn('container mx-auto px-4', widthMap[width], props.className),
    },
    children
  );
}
