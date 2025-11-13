'use client';

import {
	Alert,
	Button,
	Center,
	Container,
	Group,
	Loader,
	Paper,
	Radio,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconShield } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { fortinetLevel } from '@/core/database/schema';
import {
	createFortinetRegistration,
	getCurrentStudentFortinetRegistrations,
} from '@/server/fortinet-registration/actions';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

type FortinetLevel = (typeof fortinetLevel.enumValues)[number];

const levelDescriptions: Record<FortinetLevel, string> = {
	nse1: 'Information Security Awareness - Basic security concepts',
	nse2: 'The Evolution of Cybersecurity - Threat landscape fundamentals',
	nse3: 'Network Security Associate - Core networking and security',
	nse4: 'Network Security Professional - Advanced security implementation',
	nse5: 'Network Security Analyst - Analysis and troubleshooting',
	nse6: 'Network Security Specialist - Specialized security domains',
	nse7: 'Network Security Architect - Advanced architecture and design',
	nse8: 'Network Security Expert - Expert-level certification',
};

export default function FortinetRegistrationPage() {
	const [selectedLevel, setSelectedLevel] = useState<FortinetLevel | ''>('');
	const [message, setMessage] = useState('');
	const { student, isLoading: studentLoading } = useUserStudent();
	const queryClient = useQueryClient();

	const { data: existingRegistrations, isLoading: registrationsLoading } =
		useQuery({
			queryKey: ['fortinet-registrations', 'current-student'],
			queryFn: getCurrentStudentFortinetRegistrations,
			enabled: !!student,
		});

	const createMutation = useMutation({
		mutationFn: createFortinetRegistration,
		onSuccess: () => {
			notifications.show({
				title: 'Registration Submitted',
				message:
					'Your Fortinet training registration has been submitted successfully.',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['fortinet-registrations'] });
			setSelectedLevel('');
			setMessage('');
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Registration Failed',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleSubmit() {
		if (!selectedLevel) {
			notifications.show({
				title: 'Selection Required',
				message: 'Please select a Fortinet certification level.',
				color: 'orange',
			});
			return;
		}

		createMutation.mutate({
			level: selectedLevel,
			message: message.trim() || undefined,
		});
	}

	if (studentLoading || registrationsLoading) {
		return (
			<Center h='50vh'>
				<Loader />
			</Center>
		);
	}

	if (!student) {
		return (
			<Container size='md' py='xl'>
				<Alert color='red' icon={<IconInfoCircle />}>
					Student information not found. Please contact support.
				</Alert>
			</Container>
		);
	}

	// Check if student belongs to ICT school
	const isICTStudent = student.programs?.some(
		(program) => program.structure.program.school.id === 8
	);

	if (!isICTStudent) {
		return (
			<Container size='md' py='xl'>
				<Alert color='orange' icon={<IconInfoCircle />}>
					Fortinet training registration is only available for students in the
					Faculty of Information & Communication Technology.
				</Alert>
			</Container>
		);
	}

	const registeredLevels = new Set(
		existingRegistrations?.map((reg) => reg.level) || []
	);

	return (
		<Container size='md' py='xl'>
			<Paper shadow='sm' p='xl' radius='md'>
				<Group gap='md' mb='xl'>
					<IconShield size={32} />
					<div>
						<Title order={2}>Fortinet Training Registration</Title>
						<Text c='dimmed'>
							Register for Fortinet Network Security Expert certification levels
						</Text>
					</div>
				</Group>

				{existingRegistrations && existingRegistrations.length > 0 && (
					<Alert color='blue' icon={<IconInfoCircle />} mb='xl'>
						<Text fw={500} mb='xs'>
							Your Current Registrations:
						</Text>
						{existingRegistrations.map((reg) => (
							<Text key={reg.id} size='sm'>
								• {reg.level.toUpperCase()} - Status: {reg.status}
							</Text>
						))}
					</Alert>
				)}

				<Stack gap='lg'>
					<div>
						<Text fw={500} mb='md'>
							Select Certification Level:
						</Text>
						<Radio.Group
							value={selectedLevel}
							onChange={(value) => setSelectedLevel(value as FortinetLevel)}
						>
							<Stack gap='xs'>
								{fortinetLevel.enumValues.map((level) => (
									<Radio.Card
										key={level}
										radius='md'
										p='md'
										value={level}
										disabled={registeredLevels.has(level)}
									>
										<Group wrap='nowrap' align='flex-start'>
											<Radio.Indicator />
											<div>
												<Text className='label' fw={500}>
													{level.toUpperCase()}
												</Text>
												<Text size='sm' c='dimmed'>
													{levelDescriptions[level]}
												</Text>
											</div>
										</Group>
									</Radio.Card>
								))}
							</Stack>
						</Radio.Group>
					</div>

					<Group justify='flex-end' mt='md'>
						<Button
							size='md'
							onClick={handleSubmit}
							loading={createMutation.isPending}
							disabled={!selectedLevel}
						>
							Submit Registration
						</Button>
					</Group>
				</Stack>
			</Paper>
		</Container>
	);
}
