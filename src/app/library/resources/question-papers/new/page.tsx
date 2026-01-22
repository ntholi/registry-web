import { Box } from '@mantine/core';
import QuestionPaperForm from '../_components/Form';
import { createQuestionPaper } from '../_server/actions';

export default function NewQuestionPaperPage() {
	return (
		<Box p={'pg'}>
			<QuestionPaperForm
				onSubmit={createQuestionPaper}
				title='New Question Paper'
			/>
		</Box>
	);
}
