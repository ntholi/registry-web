'use client';
import { Skeleton, Title } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { toTitleCase } from '@/shared/lib/utils/utils';

export default function RoleDisplay() {
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return <Skeleton height={40} width={170} mb={5} />;
	}

	return (
		<Title fw={'lighter'} tt='capitalize'>
			{toTitleCase(session?.user?.role)} Portal
		</Title>
	);
}
