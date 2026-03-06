'use client';

import { Alert, Stack, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useActiveTerm } from '@/shared/lib/hooks/use-term';
import TermInput from '@/shared/ui/TermInput';

type Props = {
	value: number | null;
	onChange: (value: number | null) => void;
	error?: string;
};

export default function TermSelector({ value, onChange, error }: Props) {
	const { activeTerm } = useActiveTerm();

	return (
		<Stack gap='xs'>
			<TermInput
				value={value}
				onChange={(val) => onChange(typeof val === 'number' ? val : null)}
				error={error}
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
