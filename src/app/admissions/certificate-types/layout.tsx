'use client';

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
					label={item.name}
					description={item.description || undefined}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
