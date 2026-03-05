'use client';

import { Box, Text } from '@mantine/core';
import Copyable from '@/shared/ui/Copyable';
import Link from '@/shared/ui/Link';

type Props = {
	label: string;
	value: number | string | null | undefined;
	href?: string;
	displayValue?: string | null;
	copyable?: boolean;
};

export default function InfoItem({
	label,
	value,
	href,
	displayValue,
	copyable = true,
}: Props) {
	const content = href ? (
		<Link href={href} size='sm' fw={500}>
			{displayValue ?? value ?? 'N/A'}
		</Link>
	) : (
		<Text size='sm' fw={500}>
			{displayValue ?? value ?? 'N/A'}
		</Text>
	);

	return (
		<Box>
			<Text size='sm' c='dimmed'>
				{label}
			</Text>
			{copyable && value ? (
				<Copyable value={String(value)}>{content}</Copyable>
			) : (
				content
			)}
		</Box>
	);
}
