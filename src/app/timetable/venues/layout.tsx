'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import VenueTypeFilter from './_components/VenueTypeFilter';
import { findAllVenues } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const typeId = searchParams.get('typeId') || undefined;

	return (
		<ListLayout
			path={'/timetable/venues'}
			queryKey={['venues', searchParams.toString()]}
			getData={async (page, search) => findAllVenues(page, search, typeId)}
			actionIcons={[
				<VenueTypeFilter key='filter' />,
				<NewLink
					key='new-link'
					href='/timetable/venues/new'
					resource='venues'
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.name}
					description={`${it.type.name} (${it.capacity})`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
