import { getAssessmentTypeLabel } from '@academic/assessments/_lib/utils';
import { Divider, Grid, GridCol, Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import DocumentViewer from '../../_components/DocumentViewer';
import { deleteQuestionPaper, getQuestionPaper } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function QuestionPaperDetailsPage({ params }: Props) {
	const { id } = await params;
	const questionPaper = await getQuestionPaper(id);

	if (!questionPaper) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title={getAssessmentTypeLabel(questionPaper.assessmentType)}
				queryKey={['question-papers']}
				handleDelete={async () => {
					'use server';
					await deleteQuestionPaper(id);
				}}
			/>
			<DetailsViewBody>
				<Stack gap='lg'>
					<Grid>
						<GridCol span={10}>
							<FieldView label='Module' underline={false}>
								{questionPaper.module
									? `${questionPaper.module.code} - ${questionPaper.module.name}`
									: '-'}
							</FieldView>
						</GridCol>
						<GridCol span={2}>
							<FieldView label='Term' underline={false}>
								{questionPaper.term?.code || '-'}
							</FieldView>
						</GridCol>
					</Grid>

					<FieldView label='Assessment Type' underline={false}>
						{getAssessmentTypeLabel(questionPaper.assessmentType)}
					</FieldView>

					<FieldView label='Uploaded On' underline={false}>
						{questionPaper.createdAt
							? formatDate(questionPaper.createdAt)
							: '-'}
					</FieldView>

					<Divider label='Document' labelPosition='left' />

					<DocumentViewer
						fileUrl={questionPaper.document?.fileUrl || ''}
						fileName={questionPaper.document?.fileName || ''}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
