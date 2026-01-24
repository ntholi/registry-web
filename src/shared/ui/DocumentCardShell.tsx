'use client';

import {
	Box,
	Card,
	Group,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { DeleteButton } from './adease/DeleteButton';

type Props = {
	icon: ReactNode;
	iconColor?: string;
	title: string;
	badge?: ReactNode;
	children: ReactNode;
	onDelete: () => Promise<void>;
	deleting?: boolean;
	deleteMessage?: string;
	onClick?: () => void;
};

export function DocumentCardShell({
	icon,
	iconColor = 'green',
	title,
	badge,
	children,
	onDelete,
	deleting,
	deleteMessage = 'Are you sure you want to delete this item? This action cannot be undone.',
	onClick,
}: Props) {
	return (
		<Card
			withBorder
			radius='md'
			p='md'
			style={onClick ? { cursor: 'pointer' } : undefined}
			onClick={onClick}
		>
			<Stack gap='sm'>
				<Group wrap='nowrap' justify='space-between'>
					<Group wrap='nowrap'>
						<ThemeIcon size='lg' variant='light' color={iconColor}>
							{icon}
						</ThemeIcon>
						<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
							<Group gap='xs'>
								<Text size='sm' fw={600} truncate>
									{title}
								</Text>
							</Group>
							{badge}
						</Stack>
					</Group>
					<Box onClick={(e) => e.stopPropagation()}>
						<DeleteButton
							handleDelete={onDelete}
							message={deleteMessage}
							variant='subtle'
							disabled={deleting}
							onSuccess={() => {}}
						/>
					</Box>
				</Group>
				{children}
			</Stack>
		</Card>
	);
}

export function DocumentCardSkeleton() {
	return (
		<Card withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<Group wrap='nowrap' justify='space-between'>
					<Group wrap='nowrap'>
						<Skeleton height={42} width={42} radius='md' />
						<Skeleton height={20} width={120} />
					</Group>
					<Skeleton height={28} width={28} radius='sm' />
				</Group>
				<Stack gap={4}>
					<Skeleton height={14} width='80%' />
					<Skeleton height={14} width='60%' />
					<Skeleton height={14} width='70%' />
				</Stack>
			</Stack>
		</Card>
	);
}

type DetailRowProps = {
	label: string;
	value?: string | number | null;
	labelWidth?: number;
};

export function DocumentDetailRow({
	label,
	value,
	labelWidth = 80,
}: DetailRowProps) {
	if (!value) return null;

	return (
		<Group gap='xs'>
			<Text size='xs' c='dimmed' w={labelWidth}>
				{label}:
			</Text>
			<Text size='xs' fw={500} style={{ flex: 1 }} truncate>
				{value}
			</Text>
		</Group>
	);
}
