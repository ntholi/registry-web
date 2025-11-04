'use client';

import {
	Badge,
	Card,
	Group,
	Loader,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { formatSemester } from '@/lib/utils';

type SemesterData = {
	semesterNo: string;
	status: 'Active' | 'Repeat';
};

type Props = {
	semesterData: SemesterData | null;
	selectedModules: Set<number>;
	onSemesterChange: (data: SemesterData) => void;
	isLoading?: boolean;
};

export default function SemesterInfoCard({
	semesterData,
	selectedModules,
	onSemesterChange,
	isLoading = false,
}: Props) {
	if (selectedModules.size === 0) {
		return null;
	}

	const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
		value: (i + 1).toString(),
		label: formatSemester((i + 1).toString()),
	}));

	const statusOptions = [
		{ value: 'Active', label: 'Active' },
		{ value: 'Repeat', label: 'Repeat' },
	];

	const handleSemesterChange = (semesterNo: string) => {
		if (semesterData) {
			onSemesterChange({
				...semesterData,
				semesterNo,
			});
		}
	};

	const handleStatusChange = (status: 'Active' | 'Repeat') => {
		if (semesterData) {
			onSemesterChange({
				...semesterData,
				status,
			});
		}
	};

	return (
		<Card withBorder p='md'>
			<Stack gap='md'>
				<Group justify='space-between'>
					<Title order={4} size='h5'>
						Semester Information
					</Title>
					{isLoading ? (
						<Group gap='xs'>
							<Loader size='sm' />
							<Text size='sm' c='dimmed'>
								Determining...
							</Text>
						</Group>
					) : (
						<Badge
							radius={'sm'}
							color={semesterData?.status === 'Active' ? 'blue' : 'orange'}
						>
							{semesterData?.status}
						</Badge>
					)}
				</Group>

				<Group grow>
					<Select
						label='Semester'
						data={semesterOptions}
						value={semesterData?.semesterNo.toString()}
						onChange={(value) => {
							if (value) {
								handleSemesterChange(value);
							}
						}}
						disabled={isLoading}
					/>
					<Select
						label='Status'
						data={statusOptions}
						value={semesterData?.status}
						onChange={(value) => {
							if (value) {
								handleStatusChange(value as 'Active' | 'Repeat');
							}
						}}
						disabled={isLoading}
					/>
				</Group>
			</Stack>
		</Card>
	);
}
