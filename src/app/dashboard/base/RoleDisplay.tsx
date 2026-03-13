'use client';
import { Skeleton, Title } from '@mantine/core';
import { authClient } from '@/core/auth-client';
import { toTitleCase } from '@/shared/lib/utils/utils';

export default function RoleDisplay() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton height={40} width={170} mb={5} />;
	}

	return (
		<Title fw={'lighter'} tt='capitalize'>
			{toTitleCase(session?.user?.role)} Portal
		</Title>
	);
}
