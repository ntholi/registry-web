'use client';
import { ActionIcon, type ActionIconProps } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Resource } from '@/core/auth/permissions';
import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import { authClient } from '@/core/auth-client';

export interface NewLinkProps extends ActionIconProps {
	href: string;
	resource?: Resource;
}

export default function NewLink({ href, resource, ...props }: NewLinkProps) {
	const searchParams = useSearchParams();
	const { data: session } = authClient.useSession();

	if (
		resource &&
		!hasSessionPermission(session, resource, 'create', ['admin'])
	) {
		return null;
	}

	const newSearchParams = new URLSearchParams(searchParams);
	newSearchParams.set('view', 'details');

	const finalHref = `${href}?${newSearchParams.toString()}`;

	return (
		<ActionIcon
			size={'lg'}
			variant='default'
			href={finalHref}
			component={Link}
			{...props}
		>
			<IconPlus />
		</ActionIcon>
	);
}
