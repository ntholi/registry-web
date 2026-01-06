'use client';

import { Text } from '@mantine/core';
import { getActiveTerm } from '@registry/dates/terms';
import { useQuery } from '@tanstack/react-query';

export default function ActiveTermDisplay() {
	const {
		data: activeTerm,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['active-term'],
		queryFn: async () => {
			const term = await getActiveTerm();
			return term || null;
		},
	});

	if (isLoading)
		return (
			<Text size='sm' c='dimmed'>
				Fetching active term...
			</Text>
		);

	if (isError)
		return (
			<Text size='sm' c='red'>
				Error loading active term
			</Text>
		);

	if (!activeTerm)
		return (
			<Text size='sm' c='red'>
				No active term
			</Text>
		);

	return (
		<Text size='sm'>
			Active Term:
			<Text component='span' c='green'>
				{` ${activeTerm.code}`}
			</Text>
		</Text>
	);
}
