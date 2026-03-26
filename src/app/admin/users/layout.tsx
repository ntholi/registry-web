'use client';

import { findAllUsers } from '@admin/users';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import UsersFilter from './_components/UsersFilter';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const role = searchParams.get('role') || undefined;
	const presetId = searchParams.get('presetId') || undefined;

	return (
		<ListLayout
			path={'/admin/users'}
			queryKey={['users', searchParams.toString()]}
			getData={async (page, search) =>
				findAllUsers(page, search, role, presetId)
			}
			actionIcons={[
				<UsersFilter key='filter' />,
				<NewLink key={'new-link'} href='/admin/users/new' resource='users' />,
			]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.email} />
			)}
		>
			{children}
		</ListLayout>
	);
}
