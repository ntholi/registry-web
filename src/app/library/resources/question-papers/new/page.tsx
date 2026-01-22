import QuestionPaperForm from '../_components/Form';
import { createQuestionPaper } from '../_server/actions';

export default function NewQuestionPaperPage() {
	return (
		<QuestionPaperForm
			onSubmit={createQuestionPaper}
			title='New Question Paper'
		/>
	);
}
