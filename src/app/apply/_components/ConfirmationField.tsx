'use client';

import { Group, Stack, Text } from '@mantine/core';

type Props = {
	label: string;
	value?: string | number | null;
	labelWidth?: number;
	highlight?: boolean;
	layout?: 'horizontal' | 'vertical';
};

export function ConfirmationField({
	label,
	value,
	labelWidth = 80,
	highlight,
	layout = 'horizontal',
}: Props) {
	if (layout === 'vertical') {
		return (
			<Stack gap={2} ta='center'>
				<Text size='xs' c='dimmed' tt='uppercase' fw={500}>
					{label}
				</Text>
				<Text
					size={highlight ? 'lg' : 'sm'}
					fw={highlight ? 700 : 500}
					c={highlight ? 'cyan' : undefined}
				>
					{value?.toString() || '—'}
				</Text>
			</Stack>
		);
	}

	return (
		<Group gap={4} wrap='nowrap'>
			<Text size='xs' c='dimmed' fw={600} w={labelWidth} tt='uppercase'>
				{label}
			</Text>
			<Text size='sm' fw={500} style={{ flex: 1 }}>
				{value?.toString() || '—'}
			</Text>
		</Group>
	);
}
