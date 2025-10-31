'use client';
import { Box, Grid, Paper, Text, Title } from '@mantine/core';
import type { Student } from '@/lib/helpers/students';
import { formatDate } from '@/lib/utils';

type Props = {
	student: NonNullable<Student>;
};

function InfoItem({ label, value }: { label: string; value: string | number | null | undefined }) {
	const displayValue = value ?? 'Not provided';
	const hasValue = value !== null && value !== undefined && value !== '';

	return (
		<Box>
			<Text size="sm" c="dimmed" mb={4}>
				{label}
			</Text>
			<Text size="sm" fw={hasValue ? 500 : 400} c={hasValue ? undefined : 'dimmed'}>
				{displayValue}
			</Text>
		</Box>
	);
}

export default function PersonalInformation({ student }: Props) {
	return (
		<Paper withBorder shadow="sm" p="xl" radius="md">
			<Title order={3} size="h4" mb="lg" fw={500}>
				Personal Information
			</Title>

			<Grid>
				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Student Number" value={student.stdNo} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Full Name" value={student.name} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="National ID" value={student.nationalId} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Date of Birth" value={formatDate(student.dateOfBirth)} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Gender" value={student.gender} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Marital Status" value={student.maritalStatus} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Religion" value={student.religion} />
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6 }}>
					<InfoItem label="Primary Phone" value={student.phone1} />
				</Grid.Col>

				{student.phone2 && (
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<InfoItem label="Secondary Phone" value={student.phone2} />
					</Grid.Col>
				)}
			</Grid>
		</Paper>
	);
}
