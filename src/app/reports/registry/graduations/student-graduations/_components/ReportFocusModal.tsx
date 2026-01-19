'use client';
import {
	Badge,
	Button,
	Checkbox,
	Divider,
	Group,
	Modal,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCalendarTime,
	IconClock,
	IconFocus2,
	IconGenderBigender,
	IconMapPin,
	IconSchool,
	IconUsers,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

export const REPORT_FOCUS_AREAS = [
	{
		value: 'gender',
		label: 'Gender Distribution',
		description: 'Show male/female breakdown',
		icon: IconGenderBigender,
	},
	{
		value: 'age',
		label: 'Age Statistics',
		description: 'Show average age of graduates',
		icon: IconCalendarTime,
	},
	{
		value: 'timeToGraduate',
		label: 'Time to Graduate',
		description: 'Show average time to complete program',
		icon: IconClock,
	},
	{
		value: 'programLevel',
		label: 'Program Level',
		description: 'Show diploma, degree, masters breakdown',
		icon: IconSchool,
	},
	{
		value: 'country',
		label: 'Country/Nationality',
		description: 'Show country-wise distribution',
		icon: IconMapPin,
	},
	{
		value: 'sponsor',
		label: 'Sponsorship',
		description: 'Show sponsor distribution',
		icon: IconUsers,
	},
] as const;

export type ReportFocusArea = (typeof REPORT_FOCUS_AREAS)[number]['value'];

interface Props {
	selectedAreas: ReportFocusArea[];
	onAreasChange: (areas: ReportFocusArea[]) => void;
}

export default function ReportFocusModal({
	selectedAreas,
	onAreasChange,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleToggle(area: ReportFocusArea) {
		if (selectedAreas.includes(area)) {
			onAreasChange(selectedAreas.filter((a) => a !== area));
		} else {
			onAreasChange([...selectedAreas, area]);
		}
	}

	function handleSelectAll() {
		onAreasChange(REPORT_FOCUS_AREAS.map((a) => a.value));
	}

	function handleClearAll() {
		onAreasChange([]);
	}

	const selectedCount = selectedAreas.length;
	const totalCount = REPORT_FOCUS_AREAS.length;

	return (
		<>
			<Button
				variant='light'
				leftSection={<IconFocus2 size={16} />}
				onClick={open}
				rightSection={
					selectedCount > 0 ? (
						<Badge size='sm' variant='filled' circle>
							{selectedCount}
						</Badge>
					) : null
				}
			>
				Report Focus
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title={
					<Group gap='xs'>
						<IconFocus2 size={20} />
						<Text fw={600}>Report Focus Areas</Text>
					</Group>
				}
				size='md'
			>
				<Stack>
					<Text size='sm' c='dimmed'>
						Select which areas to include in the summary report. When nothing is
						selected, all areas will be shown by default.
					</Text>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							{selectedCount} of {totalCount} selected
						</Text>
						<Group gap='xs'>
							<Button
								variant='subtle'
								size='xs'
								onClick={handleSelectAll}
								disabled={selectedCount === totalCount}
							>
								Select All
							</Button>
							<Button
								variant='subtle'
								size='xs'
								onClick={handleClearAll}
								disabled={selectedCount === 0}
							>
								Clear All
							</Button>
						</Group>
					</Group>

					<Divider />

					<Stack gap='sm'>
						{REPORT_FOCUS_AREAS.map((area) => {
							const Icon = area.icon;
							const isSelected = selectedAreas.includes(area.value);

							return (
								<FocusAreaItem
									key={area.value}
									icon={<Icon size={18} />}
									label={area.label}
									description={area.description}
									checked={isSelected}
									onChange={() => handleToggle(area.value)}
								/>
							);
						})}
					</Stack>

					<Divider />

					<Group justify='flex-end'>
						<Button onClick={close}>Done</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}

interface FocusAreaItemProps {
	icon: ReactNode;
	label: string;
	description: string;
	checked: boolean;
	onChange: () => void;
}

function FocusAreaItem({
	icon,
	label,
	description,
	checked,
	onChange,
}: FocusAreaItemProps) {
	return (
		<Group
			wrap='nowrap'
			gap='sm'
			style={{ cursor: 'pointer' }}
			onClick={onChange}
		>
			<Checkbox checked={checked} onChange={onChange} />
			<ThemeIcon variant='light' size='md'>
				{icon}
			</ThemeIcon>
			<Stack gap={0} style={{ flex: 1 }}>
				<Text size='sm' fw={500}>
					{label}
				</Text>
				<Text size='xs' c='dimmed'>
					{description}
				</Text>
			</Stack>
		</Group>
	);
}
