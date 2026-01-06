'use client';

import { Alert, Select, Stack, Text } from '@mantine/core';
import { getAllTerms } from '@registry/dates/terms';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';

type Props = {
	value: number | null;
	onChange: (value: number | null) => void;
	error?: string;
};

export default function TermSelector({ value, onChange, error }: Props) {
	const { activeTerm } = useActiveTerm();
	const { data: terms, isLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	const termOptions =
		terms?.map((term) => ({
			value: term.id.toString(),
			label: term.code,
		})) || [];

	return (
		<Stack gap='xs'>
			<Select
				label='Term'
				placeholder='Select term'
				data={termOptions}
				value={value?.toString() || ''}
				onChange={(val) => onChange(val ? Number.parseInt(val, 10) : null)}
				error={error}
				searchable
				disabled={isLoading}
			/>
			{activeTerm && value !== activeTerm.id && (
				<Alert color='yellow' icon={<IconInfoCircle size={14} />}>
					<Text size='xs'>
						Note: Selected term differs from the active term ({activeTerm.code})
					</Text>
				</Alert>
			)}
		</Stack>
	);
}
