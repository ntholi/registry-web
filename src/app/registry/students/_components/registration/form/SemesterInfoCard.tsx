'use client';

import {
	Alert,
	Badge,
	Group,
	Loader,
	NumberInput,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { formatSemester } from '@/shared/lib/utils/utils';

type SemesterData = {
	semesterNo: string;
	status: 'Active' | 'Repeat';
};

type Props = {
	semesterData: SemesterData | null;
	selectedModules: Set<number>;
	onSemesterChange?: (data: SemesterData) => void;
	isLoading?: boolean;
};

const statusColorMap: Record<'Active' | 'Repeat', string> = {
	Active: 'green',
	Repeat: 'yellow',
};

const semesterOptions = Array.from({ length: 14 }, (_, i) => ({
	value: `${i + 1}`,
	label: formatSemester(`${i + 1}`),
}));

export default function SemesterInfoCard({
	semesterData,
	selectedModules,
	onSemesterChange,
	isLoading = false,
}: Props) {
	if (isLoading) {
		return (
			<Paper withBorder p='md'>
				<Group gap='xs'>
					<Loader size='sm' />
					<Text size='sm' c='dimmed'>
						Calculating semester...
					</Text>
				</Group>
			</Paper>
		);
	}

	if (selectedModules.size === 0) {
		return (
			<Alert color='blue' icon={<IconInfoCircle size={16} />}>
				Select modules to determine semester
			</Alert>
		);
	}

	if (!semesterData) {
		return (
			<Alert color='yellow' icon={<IconInfoCircle size={16} />}>
				Unable to determine semester status
			</Alert>
		);
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Group justify='space-between'>
					<Text fw={500}>Semester Information</Text>
					<Badge
						color={statusColorMap[semesterData.status]}
						variant='light'
						size='lg'
					>
						{semesterData.status}
					</Badge>
				</Group>

				<Group grow>
					<NumberInput
						label='Semester Number'
						value={Number.parseInt(semesterData.semesterNo, 10)}
						onChange={(value) => {
							if (typeof value === 'number' && onSemesterChange) {
								onSemesterChange({
									...semesterData,
									semesterNo: value.toString(),
								});
							}
						}}
						min={1}
						max={14}
					/>

					<Select
						label='Status'
						value={semesterData.status}
						onChange={(value) => {
							if (value && onSemesterChange) {
								onSemesterChange({
									...semesterData,
									status: value as 'Active' | 'Repeat',
								});
							}
						}}
						data={[
							{ value: 'Active', label: 'Active' },
							{ value: 'Repeat', label: 'Repeat' },
						]}
					/>
				</Group>

				<Text size='sm' c='dimmed'>
					Determined: {formatSemester(semesterData.semesterNo)} (
					{semesterData.status})
				</Text>
			</Stack>
		</Paper>
	);
}
