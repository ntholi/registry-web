'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconFilter, IconFilterOff } from '@tabler/icons-react';
import { useState } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';

export interface ModuleViewToggleProps {
	onToggle: (showAssignedOnly: boolean) => void;
	defaultValue?: boolean;
	assignedOnlyTooltip?: string;
	allModulesTooltip?: string;
}

export function ModuleViewToggle({
	onToggle,
	defaultValue = true,
	assignedOnlyTooltip = 'Show assigned modules only',
	allModulesTooltip = 'Show all modules',
}: ModuleViewToggleProps) {
	const [showAssignedOnly, setShowAssignedOnly] = useState(defaultValue);

	const handleToggle = () => {
		const newValue = !showAssignedOnly;
		setShowAssignedOnly(newValue);
		onToggle(newValue);
	};

	return (
		<Tooltip label={showAssignedOnly ? allModulesTooltip : assignedOnlyTooltip}>
			<ActionIcon
				variant={showAssignedOnly ? 'filled' : 'outline'}
				color={getStatusColor(showAssignedOnly ? 'assigned' : 'unassigned')}
				onClick={handleToggle}
				size='lg'
			>
				{showAssignedOnly ? (
					<IconFilter size='1rem' />
				) : (
					<IconFilterOff size='1rem' />
				)}
			</ActionIcon>
		</Tooltip>
	);
}
