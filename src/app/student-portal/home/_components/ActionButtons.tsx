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
import {
	type Icon,
	IconChevronRight,
	IconClipboardCheck,
	IconFileCertificate,
	IconFilePlus,
	IconSchool,
	IconShield,
} from '@tabler/icons-react';
import Link from 'next/link';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import { semantic } from '@/shared/lib/utils/colors';

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
		color: semantic.neutral,
		description: 'Submit or view your registration requests',
	},
	{
		label: 'Transcripts',
		icon: IconFileCertificate,
		href: '/student-portal/transcripts',
		color: semantic.neutral,
		description: 'View and download your academic transcripts',
	},
	{
		label: 'Graduation',
		icon: IconSchool,
		href: '/student-portal/graduation',
		color: semantic.neutral,
		description: 'Submit your graduation request',
	},
];

export default function ActionButtons() {
	const { student, program, isLoading } = useUserStudent();

	if (isLoading || !student) {
		return null;
	}

	const isICTStudent = student.programs?.some(
		(program) => program.structure.program.school.id === 8
	);

	const actions = [...baseActions];
	const hasActiveProgram = !!program;

	if (isICTStudent) {
		actions.push({
			label: 'Fortinet Training',
			icon: IconShield,
			href: '/student-portal/fortinet-registration',
			color: semantic.neutral,
			description: 'Register for Fortinet network security certification',
		});
	}

	if (!hasActiveProgram) {
		actions.push({
			label: 'Apply',
			icon: IconFilePlus,
			href: '/apply',
			color: semantic.neutral,
			description: 'Apply for a new Program',
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
