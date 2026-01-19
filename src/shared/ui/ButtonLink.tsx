'use client';

import { Button, type ButtonProps } from '@mantine/core';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import type React from 'react';

type Props = ButtonProps &
	LinkProps & {
		href: string;
		children: React.ReactNode;
		target?: '_self' | '_blank' | '_parent' | '_top';
	};

export default function ButtonLink(props: Props) {
	return (
		<Button component={Link} {...props}>
			{props.children}
		</Button>
	);
}
