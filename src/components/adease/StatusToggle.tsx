'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconLock, IconLockOpen } from '@tabler/icons-react';
import { useState } from 'react';

export interface StatusToggleProps {
	onToggle: (status: 'blocked' | 'unblocked') => void;
	defaultStatus?: 'blocked' | 'unblocked';
	blockedTooltip?: string;
	unblockedTooltip?: string;
}

export function StatusToggle({
	onToggle,
	defaultStatus = 'blocked',
	blockedTooltip = 'Show blocked students',
	unblockedTooltip = 'Show unblocked students',
}: StatusToggleProps) {
	const [status, setStatus] = useState<'blocked' | 'unblocked'>(defaultStatus);

	const handleToggle = () => {
		const newStatus = status === 'blocked' ? 'unblocked' : 'blocked';
		setStatus(newStatus);
		onToggle(newStatus);
	};

	return (
		<Tooltip label={status === 'blocked' ? unblockedTooltip : blockedTooltip}>
			<ActionIcon
				variant={status === 'blocked' ? 'filled' : 'outline'}
				color={status === 'blocked' ? 'red' : 'green'}
				onClick={handleToggle}
				size="lg"
			>
				{status === 'blocked' ? <IconLock size="1rem" /> : <IconLockOpen size="1rem" />}
			</ActionIcon>
		</Tooltip>
	);
}
