'use client';
import {
	Box,
	Grid,
	Group,
	type MantineColor,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { studentColors } from '@student-portal/utils';
import {
	type Icon,
	IconChevronRight,
	IconClipboardCheck,
	IconFileCertificate,
	IconSchool,
	IconShield,
} from '@tabler/icons-react';
import Link from 'next/link';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

type Action = {
	label: string;
	icon: Icon;
	href: string;
	color: MantineColor;
	description: string;
};

const baseActions: Action[] = [
	{
		label: 'Registration',
		icon: IconClipboardCheck,
		href: '/student-portal/registration',
		color: studentColors.theme.primary,
		description: 'Submit or view your registration requests',
	},
	{
		label: 'Transcripts',
		icon: IconFileCertificate,
		href: '/student-portal/transcripts',
		color: studentColors.theme.primary,
		description: 'View and download your academic transcripts',
	},
	{
		label: 'Graduation',
		icon: IconSchool,
		href: '/student-portal/graduation',
		color: studentColors.theme.primary,
		description: 'Submit your graduation request',
	},
];

export default function ActionButtons() {
	const { student, isLoading } = useUserStudent();

	// Don't render until we have student data
	if (isLoading || !student) {
		return null;
	}

	// Check if student belongs to school 8 (Faculty of Information & Communication Technology)
	const isICTStudent = student.programs?.some(
		(program) => program.structure.program.school.id === 8
	);

	const actions = [...baseActions];

	// Add Fortinet registration option for ICT students only
	if (isICTStudent) {
		actions.push({
			label: 'Fortinet Training',
			icon: IconShield,
			href: '/student-portal/fortinet-registration',
			color: studentColors.theme.primary,
			description: 'Register for Fortinet network security certification',
		});
	}

	return (
		<Box mt='xl'>
			<Grid gutter='lg'>
				{actions.map((action) => (
					<Grid.Col key={action.label} span={{ base: 12, sm: 6 }}>
						<Paper
							component={Link}
							href={action.href}
							shadow='sm'
							p='lg'
							radius='md'
							withBorder
						>
							<Group gap='md' wrap='nowrap'>
								<ThemeIcon
									size='xl'
									radius='md'
									variant='light'
									color={action.color}
								>
									<action.icon size='1.5rem' />
								</ThemeIcon>
								<Stack gap={4} flex={1}>
									<Text size='lg' fw={600}>
										{action.label}
									</Text>
									<Text size='sm' c='dimmed' lh={1.4}>
										{action.description}
									</Text>
								</Stack>
								<IconChevronRight size='1rem' />
							</Group>
						</Paper>
					</Grid.Col>
				))}
			</Grid>
		</Box>
	);
}
