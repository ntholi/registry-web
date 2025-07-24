'use client';

import { Image } from '@mantine/core';
import { useComputedColorScheme } from '@mantine/core';

interface LogoProps {
  height?: number;
  className?: string;
}

export default function Logo({ height = 50, className }: LogoProps) {
  const colorScheme = useComputedColorScheme();
  const testEnv = process.env.NEXT_PUBLIC_DEV_LOGO;

  return (
    <Image
      src={`/images/logo-${testEnv ?? colorScheme}.png`}
      alt="logo"
      w={'auto'}
      h={height}
      className={className}
    />
  );
} 