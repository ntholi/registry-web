'use client';
import { ActionIcon, type ActionIconProps } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export interface NewLinkProps extends ActionIconProps {
	href: string;
}

export default function NewLink({ href, ...props }: NewLinkProps) {
	const searchParams = useSearchParams();
	const newSearchParams = new URLSearchParams(searchParams);
	newSearchParams.set('view', 'details');

	const finalHref = `${href}?${newSearchParams.toString()}`;

	return (
		<ActionIcon size={'lg'} variant='default' href={finalHref} component={Link} {...props}>
			<IconPlus />
		</ActionIcon>
	);
}
