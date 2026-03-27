'use client';

import { ActionIcon, Indicator, Popover, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';

export type FilterButtonProps = {
	opened?: boolean;
	activeCount?: number;
	label: string;
	onClick: () => void;
};

export function FilterButton({
	opened,
	activeCount = 0,
	label,
	onClick,
}: FilterButtonProps) {
	const hasActive = activeCount > 0;
	const [openedPopover, { close: closePopover, open: openPopover }] =
		useDisclosure(false);

	return (
		<Popover
			withArrow
			withinPortal={false}
			position='bottom'
			opened={openedPopover}
		>
			<Popover.Target>
				<Indicator
					size={16}
					label={activeCount}
					disabled={!hasActive}
					processing={opened}
					color='orange'
				>
					<ActionIcon
						variant={hasActive ? 'filled' : 'default'}
						onMouseEnter={openPopover}
						onMouseLeave={closePopover}
						size='input-sm'
						onClick={onClick}
					>
						<IconFilter size={16} />
					</ActionIcon>
				</Indicator>
			</Popover.Target>
			<Popover.Dropdown style={{ pointerEvents: 'none' }}>
				<Text size='sm'>{label}</Text>
			</Popover.Dropdown>
		</Popover>
	);
}
