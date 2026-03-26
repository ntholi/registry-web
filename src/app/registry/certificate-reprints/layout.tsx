'use client';

import { Badge } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import CertificateReprintStatusFilter from './_components/CertificateReprintStatusFilter';
import { findAllCertificateReprints } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const status = searchParams.get('status') || 'all';

	return (
		<ListLayout
			path='/registry/certificate-reprints'
			queryKey={['certificate-reprints', searchParams.toString()]}
			getData={(page, search) =>
				findAllCertificateReprints(
					page,
					search,
					status !== 'all' ? status : undefined
				)
			}
			actionIcons={[
				<CertificateReprintStatusFilter key='status-filter' />,
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
