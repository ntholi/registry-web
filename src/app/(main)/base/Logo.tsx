'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';

type Props = {
  className?: string;
  width?: number;
  height?: number;
};

export default function Logo({ className, width = 90, height = 90 }: Props) {
  const testEnv = process.env.NEXT_PUBLIC_DEV_LOGO;

  const { theme } = useTheme();

  return (
    <Image
      width={width}
      height={height}
      className={className}
      src={`/images/logo-${testEnv ?? theme}.png`}
      alt='Logo'
    />
  );
}
