'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { isIntakePeriodActive } from '@/shared/lib/utils/dates';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { IntakePeriod } from './_lib/types';
import { findAllIntakePeriods } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<IntakePeriod>
			path='/admissions/intake-periods'
			queryKey={['intake-periods']}
			getData={findAllIntakePeriods}
			actionIcons={[
				<NewLink key='new-link' href='/admissions/intake-periods/new' />,
			]}
			renderItem={(item) => {
				const isActive = isIntakePeriodActive(item.startDate, item.endDate);
				return (
					<ListItem
						id={item.id}
						label={
							<Group gap='xs'>
								{item.name}
								{isActive && (
									<Badge size='xs' color='green'>
										Active
									</Badge>
								)}
							</Group>
						}
						description={`${item.startDate} to ${item.endDate}`}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
