import { Badge, Paper, Stack, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import type { ClassificationRules, SubjectGradeRules } from '../_lib/types';
import {
	deleteEntryRequirement,
	getEntryRequirement,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EntryRequirementDetails({ params }: Props) {
	const { id } = await params;
	const item = await getEntryRequirement(Number(id));

	if (!item) {
		return notFound();
	}

	const rules = item.rules as SubjectGradeRules | ClassificationRules;
	const isSubjectBased = rules?.type === 'subject-grades';

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Entry Requirement'
				queryKey={['entry-requirements']}
				handleDelete={async () => {
					'use server';
					await deleteEntryRequirement(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Program'>
					{'program' in item && item.program ? (
						<Text>
							{item.program.code} - {item.program.name}
						</Text>
					) : (
						<Text c='dimmed'>Unknown</Text>
					)}
				</FieldView>
				<FieldView label='Certificate Type'>
					{'certificateType' in item && item.certificateType ? (
						<Badge>
							{item.certificateType.name} (Level {item.certificateType.lqfLevel}
							)
						</Badge>
					) : (
						<Text c='dimmed'>Unknown</Text>
					)}
				</FieldView>

				<Paper withBorder p='md' mt='md'>
					<Title order={5} mb='md'>
						Requirements
					</Title>

					{isSubjectBased && (
						<Stack gap='sm'>
							<FieldView label='Minimum Passes'>
								{(rules as SubjectGradeRules).minimumGrades.count} subjects at
								grade {(rules as SubjectGradeRules).minimumGrades.grade} or
								better
							</FieldView>
							{(rules as SubjectGradeRules).requiredSubjects.length > 0 && (
								<FieldView label='Required Subjects'>
									<Stack gap='xs'>
										{(rules as SubjectGradeRules).requiredSubjects.map(
											(rs, idx) => (
												<Text key={idx} size='sm'>
													Subject #{rs.subjectId} - Minimum: {rs.minimumGrade}
												</Text>
											)
										)}
									</Stack>
								</FieldView>
							)}
						</Stack>
					)}

					{!isSubjectBased && (
						<Stack gap='sm'>
							<FieldView label='Minimum Classification'>
								<Badge color='blue'>
									{(rules as ClassificationRules).minimumClassification}
								</Badge>
							</FieldView>
							{(rules as ClassificationRules).requiredQualificationName && (
								<FieldView label='Required Qualification'>
									{(rules as ClassificationRules).requiredQualificationName}
								</FieldView>
							)}
						</Stack>
					)}
				</Paper>
			</DetailsViewBody>
		</DetailsView>
	);
}
