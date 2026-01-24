'use client';

import type { Applicant } from '@admissions/applicants';
import {
	Badge,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconCalendar,
	IconId,
	IconMapPin,
	IconUser,
} from '@tabler/icons-react';

type Props = {
	applicant: Applicant;
};

export default function ProfileView({ applicant }: Props) {
	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Group gap='sm'>
					<ThemeIcon size='lg' variant='light'>
						<IconUser size={20} />
					</ThemeIcon>
					<Title order={3}>Your Profile</Title>
				</Group>

				<Text size='sm' c='dimmed'>
					This information was extracted from your uploaded documents. You can
					update it in the Personal Info step.
				</Text>

				<Grid gutter='md'>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconUser size={16} />}
							label='Full Name'
							value={applicant.fullName}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconCalendar size={16} />}
							label='Date of Birth'
							value={applicant.dateOfBirth}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconId size={16} />}
							label='National ID'
							value={applicant.nationalId}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='Nationality' value={applicant.nationality} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='Gender' value={applicant.gender} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconMapPin size={16} />}
							label='Birth Place'
							value={applicant.birthPlace}
						/>
					</Grid.Col>
					<Grid.Col span={12}>
						<FieldDisplay label='Address' value={applicant.address} />
					</Grid.Col>
				</Grid>
			</Stack>
		</Paper>
	);
}

type FieldDisplayProps = {
	icon?: React.ReactNode;
	label: string;
	value?: string | null;
};

function FieldDisplay({ icon, label, value }: FieldDisplayProps) {
	return (
		<Stack gap={4}>
			<Group gap='xs'>
				{icon && (
					<ThemeIcon size='xs' variant='transparent' c='dimmed'>
						{icon}
					</ThemeIcon>
				)}
				<Text size='xs' c='dimmed'>
					{label}
				</Text>
			</Group>
			{value ? (
				<Text size='sm' fw={500}>
					{value}
				</Text>
			) : (
				<Badge size='xs' variant='light' color='gray'>
					Not provided
				</Badge>
			)}
		</Stack>
	);
}
