'use client';

import { Badge } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllCertificateReprints } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/registry/certificate-reprints'
			queryKey={['certificate-reprints']}
			getData={findAllCertificateReprints}
			actionIcons={[
				<NewLink
					key='new-link'
					href='/registry/certificate-reprints/new'
					resource='certificate-reprints'
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.student?.name ?? String(it.stdNo)}
					rightSection={
						<Badge
							size='xs'
							color={getStatusColor(
								it.status === 'printed' ? 'approved' : 'pending'
							)}
							variant='light'
						>
							{it.status}
						</Badge>
					}
					description={it.receiptNumber || 'No Receipt'}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
