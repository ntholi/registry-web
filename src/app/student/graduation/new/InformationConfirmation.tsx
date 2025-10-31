'use client';

import { Alert, Box, Card, Checkbox, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import {
	IconAlertTriangle,
	IconGenderFemale,
	IconGenderMale,
	IconId,
	IconSchool,
	IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { students } from '@/db/schema';

type Student = typeof students.$inferSelect & {
	user?: { name?: string | null } | null;
};

type SelectedProgram = {
	structure: {
		program: {
			id: number;
			name: string;
			code: string;
			level: 'certificate' | 'diploma' | 'degree';
			school: {
				name: string;
			};
		};
	};
};

interface InformationConfirmationProps {
	student: Student;
	selectedProgram: SelectedProgram | null;
	confirmed: boolean;
	onConfirm: (confirmed: boolean) => void;
}

export default function InformationConfirmation({
	student,
	selectedProgram,
	confirmed,
	onConfirm,
}: InformationConfirmationProps) {
	const [confirmationText, setConfirmationText] = useState('');
	const [hasTypedCorrectly, setHasTypedCorrectly] = useState(false);

	const handleConfirmationTextChange = (value: string) => {
		setConfirmationText(value);
		const isCorrect = value.toLowerCase() === 'information correct';
		setHasTypedCorrectly(isCorrect);

		if (isCorrect) {
			onConfirm(true);
		} else {
			onConfirm(false);
		}
	};

	return (
		<Stack gap="lg">
			<Alert
				icon={<IconAlertTriangle size="1.5rem" />}
				title="Verify Your Information"
				color="orange"
				variant="light"
			>
				<Stack gap="sm">
					<Text size="sm">
						Please carefully verify that your personal information below is correct.
					</Text>
					<Text size="sm">
						If this information is <strong>not</strong> correct, you must report to the Registry
						Department before the clearance deadline. This information <strong>cannot</strong> be
						corrected after the clearance deadline has passed.
					</Text>
				</Stack>
			</Alert>

			<Card withBorder shadow="sm" radius="md" padding="lg">
				<Title order={3} mb="md">
					Your Information
				</Title>

				<Stack gap="md">
					<Group>
						<IconUser size="1.2rem" color="gray" />
						<Box>
							<Text size="xs" c="dimmed">
								Full Name
							</Text>
							<Text fw={500}>{student.name}</Text>
						</Box>
					</Group>

					<Group>
						<IconId size="1.2rem" color="gray" />
						<Box>
							<Text size="xs" c="dimmed">
								National ID Number
							</Text>
							<Text fw={500}>{student.nationalId || 'Not provided'}</Text>
						</Box>
					</Group>

					<Group>
						{student.gender === 'Male' ? (
							<IconGenderMale size="1.2rem" color="gray" />
						) : (
							<IconGenderFemale size="1.2rem" color="gray" />
						)}
						<Box>
							<Text size="xs" c="dimmed">
								Gender
							</Text>
							<Text fw={500}>{student.gender || 'Not specified'}</Text>
						</Box>
					</Group>

					<Group>
						<IconId size="1.2rem" color="gray" />
						<Box>
							<Text size="xs" c="dimmed">
								Student Number
							</Text>
							<Text fw={500}>{student.stdNo}</Text>
						</Box>
					</Group>
					<Group>
						<IconId size="1.2rem" color="gray" />
						<Box>
							<Text size="xs" c="dimmed">
								Phone Number
							</Text>
							<Text fw={500}>{getPhoneNumbers(student)}</Text>
						</Box>
					</Group>
				</Stack>
			</Card>

			{selectedProgram && (
				<Card withBorder shadow="sm" radius="md" padding="lg">
					<Group mb="md">
						<Title order={3}>Program</Title>
					</Group>

					<Stack gap="md">
						<Group>
							<IconSchool size="1.2rem" color="gray" />
							<Box>
								<Text size="xs" c="dimmed">
									Program Name
								</Text>
								<Text fw={500}>
									{selectedProgram.structure.program.name} ({selectedProgram.structure.program.code}
									)
								</Text>
							</Box>
						</Group>

						<Group>
							<IconId size="1.2rem" color="gray" />
							<Box>
								<Text size="xs" c="dimmed">
									Level
								</Text>
								<Text fw={500} style={{ textTransform: 'capitalize' }}>
									{selectedProgram.structure.program.level}
								</Text>
							</Box>
						</Group>
					</Stack>
				</Card>
			)}

			<Card withBorder shadow="sm" radius="md" padding="lg">
				<Title order={4} mb="md">
					Confirmation Required
				</Title>

				<Stack gap="md">
					<Text>
						To proceed with your graduation clearance, please verify that ALL the information above
						is correct.
					</Text>

					<Text fw={500} c="red" size="sm">
						Type exactly &quot;information correct&quot; (without quotes) to confirm:
					</Text>

					<TextInput
						placeholder='Type "information correct" here...'
						value={confirmationText}
						onChange={(event) => handleConfirmationTextChange(event.currentTarget.value)}
						error={
							confirmationText.length > 0 && !hasTypedCorrectly
								? 'Please type exactly "information correct"'
								: null
						}
						data-testid="confirmation-input"
					/>

					<Checkbox
						checked={confirmed && hasTypedCorrectly}
						disabled={!hasTypedCorrectly}
						onChange={() => {}}
						label={
							<Text size="sm">
								I confirm that all my personal information displayed above is correct and accurate
							</Text>
						}
					/>
				</Stack>
			</Card>
		</Stack>
	);
}

function getPhoneNumbers(student: Student): string {
	const phoneNumbers = [];
	if (student.phone1) {
		phoneNumbers.push(student.phone1);
	}
	if (student.phone2) {
		phoneNumbers.push(student.phone2);
	}
	return phoneNumbers.length > 0 ? phoneNumbers.join(', ') : 'Not provided';
}
