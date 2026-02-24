'use client';

import AcademicRecordsTab from '@admissions/applicants/[id]/_components/AcademicRecordsTab';
import type { AcademicRecordWithRelations } from '@admissions/applicants/[id]/academic-records/_lib/types';
import { Card, Grid, GridCol, Stack, Text } from '@mantine/core';
import { FieldView } from '@/shared/ui/adease';
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
			<FieldView label='Applicant'>
				<Link href={`/admissions/applicants/${applicant.id}`}>
					{applicant.fullName}
				</Link>
			</FieldView>

			<Grid>
				<GridCol span={7}>
					<Card withBorder>
						<Stack gap='xs'>
							<Text size='xs' tt='uppercase'>
								1st Choice
							</Text>
							{firstChoiceProgram ? (
								<Text fw={600} size='sm'>
									{firstChoiceProgram.name}
								</Text>
							) : (
								<Text size='sm' c='dimmed'>
									Not selected
								</Text>
							)}
						</Stack>
					</Card>
				</GridCol>

				<GridCol span={5}>
					<Card withBorder>
						<Stack gap='xs'>
							<Text size='xs' c='dimmed' tt='uppercase'>
								2nd Choice
							</Text>
							{secondChoiceProgram ? (
								<Text size='sm'>{secondChoiceProgram.name}</Text>
							) : (
								<Text size='sm' c='dimmed'>
									Not selected
								</Text>
							)}
						</Stack>
					</Card>
				</GridCol>
			</Grid>

			<AcademicRecordsTab records={academicRecords} />
		</Stack>
	);
}
