import { notFound } from 'next/navigation';
import QuestionPaperForm from '../../_components/Form';
import { getQuestionPaper, updateQuestionPaper } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditQuestionPaperPage({ params }: Props) {
	const { id } = await params;
	const questionPaper = await getQuestionPaper(id);

	if (!questionPaper) return notFound();

	return (
		<QuestionPaperForm
			onSubmit={(data) => updateQuestionPaper(questionPaper.id, data)}
			defaultValues={questionPaper}
			title='Edit Question Paper'
		/>
	);
}
