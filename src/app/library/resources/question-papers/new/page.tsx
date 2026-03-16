import { Box } from '@mantine/core';
import { unwrap } from '@/shared/lib/actions/actionResult';
import QuestionPaperForm from '../_components/Form';
import { createQuestionPaper } from '../_server/actions';

export default function NewQuestionPaperPage() {
	return (
		<Box p={'pg'}>
			<QuestionPaperForm
				onSubmit={async (data) => {
					'use server';
					return unwrap(await createQuestionPaper(data));
				}}
				title='New Question Paper'
			/>
		</Box>
	);
}
