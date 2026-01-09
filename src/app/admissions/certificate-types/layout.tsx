'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { CertificateTypeWithMappings } from './_lib/types';
import { findAllCertificateTypes } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<CertificateTypeWithMappings>
			path='/admissions/certificate-types'
			queryKey={['certificate-types']}
			getData={findAllCertificateTypes}
			actionIcons={[
				<NewLink key='new-link' href='/admissions/certificate-types/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={
						<Group gap='xs'>
							{item.name}
							<Badge size='xs' variant='light'>
								LQF {item.lqfLevel}
							</Badge>
						</Group>
					}
					description={item.description || undefined}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
