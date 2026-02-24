'use client';

import AcademicRecordsTab from '@admissions/applicants/[id]/_components/AcademicRecordsTab';
import type { AcademicRecordWithRelations } from '@admissions/applicants/[id]/academic-records/_lib/types';
import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import Link from '@/shared/ui/Link';

type Props = {
	applicant: {
		id: string;
		fullName: string;
		nationalId: string | null;
	};
	firstChoiceProgram: {
		id: number;
		name: string;
		code: string;
		school: { shortName: string | null } | null;
	} | null;
	secondChoiceProgram: {
		id: number;
		name: string;
		code: string;
		school: { shortName: string | null } | null;
	} | null;
	academicRecords: AcademicRecordWithRelations[];
};

export default function OverviewTab({
	applicant,
	firstChoiceProgram,
	secondChoiceProgram,
	academicRecords,
}: Props) {
	return (
		<Stack gap='lg'>
			<Card withBorder radius='md' p='lg'>
				<Stack gap='sm'>
					<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
						Applicant
					</Text>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={2}>
							<Link
								href={`/admissions/applicants/${applicant.id}`}
								fw={600}
								size='lg'
							>
								{applicant.fullName}
							</Link>
							{applicant.nationalId && (
								<Text size='sm' c='dimmed'>
									{applicant.nationalId}
								</Text>
							)}
						</Stack>
					</Group>
				</Stack>
			</Card>

			<Group grow align='stretch'>
				<Card withBorder radius='md' p='lg'>
					<Stack gap='xs'>
						<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
							First Choice
						</Text>
						{firstChoiceProgram ? (
							<Stack gap={2}>
								<Text fw={600}>{firstChoiceProgram.name}</Text>
								<Group gap='xs'>
									<Badge variant='light' size='sm'>
										{firstChoiceProgram.code}
									</Badge>
									{firstChoiceProgram.school && (
										<Badge variant='outline' size='sm' color='gray'>
											{firstChoiceProgram.school.shortName}
										</Badge>
									)}
								</Group>
							</Stack>
						) : (
							<Text size='sm' c='dimmed'>
								Not selected
							</Text>
						)}
					</Stack>
				</Card>

				<Card withBorder radius='md' p='lg'>
					<Stack gap='xs'>
						<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
							Second Choice
						</Text>
						{secondChoiceProgram ? (
							<Stack gap={2}>
								<Text fw={600}>{secondChoiceProgram.name}</Text>
								<Group gap='xs'>
									<Badge variant='light' size='sm'>
										{secondChoiceProgram.code}
									</Badge>
									{secondChoiceProgram.school && (
										<Badge variant='outline' size='sm' color='gray'>
											{secondChoiceProgram.school.shortName}
										</Badge>
									)}
								</Group>
							</Stack>
						) : (
							<Text size='sm' c='dimmed'>
								Not selected
							</Text>
						)}
					</Stack>
				</Card>
			</Group>

			<Stack gap='xs'>
				<Text size='sm' fw={600} c='dimmed' tt='uppercase' px='md'>
					Academic Records
				</Text>
				<AcademicRecordsTab records={academicRecords} />
			</Stack>
		</Stack>
	);
}
