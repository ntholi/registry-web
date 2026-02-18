import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteQuestion, getQuestion } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function QuestionDetails({ params }: Props) {
	const { id } = await params;
	const question = await getQuestion(Number(id));

	if (!question) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Question'
				queryKey={['feedback-questions']}
				handleDelete={async () => {
					'use server';
					await deleteQuestion(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Category'>{question.category?.name}</FieldView>
				<FieldView label='Question'>{question.text}</FieldView>
				<FieldView label='Status'>
					<Badge color={question.active ? 'green' : 'gray'}>
						{question.active ? 'Active' : 'Inactive'}
					</Badge>
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
