'use client';

import AcademicRecordsTab from '@admissions/applicants/[id]/_components/AcademicRecordsTab';
import type { AcademicRecordWithRelations } from '@admissions/applicants/[id]/academic-records/_lib/types';
import { Card, Grid, GridCol, Stack, Text } from '@mantine/core';

type Props = {
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
	firstChoiceProgram,
	secondChoiceProgram,
	academicRecords,
}: Props) {
	return (
		<Stack gap='lg'>
			<Grid>
				<GridCol span={7}>
					<Card withBorder>
						{firstChoiceProgram ? (
							<Text fw={600} size='sm'>
								{firstChoiceProgram.name}
							</Text>
						) : (
							<Text size='sm' c='dimmed'>
								Not selected
							</Text>
						)}
						<Text size='xs' c={'dimmed'}>
							1st Choice
						</Text>
					</Card>
				</GridCol>

				<GridCol span={5}>
					<Card withBorder>
						{secondChoiceProgram ? (
							<Text fw={600} size='sm'>
								{secondChoiceProgram.name}
							</Text>
						) : (
							<Text size='sm' c='dimmed'>
								Not selected
							</Text>
						)}
						<Text size='xs' c='dimmed'>
							2nd Choice
						</Text>
					</Card>
				</GridCol>
			</Grid>

			<AcademicRecordsTab records={academicRecords} />
		</Stack>
	);
}
