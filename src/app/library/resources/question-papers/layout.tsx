'use client';

import { getAssessmentTypeLabel } from '@academic/assessments/_lib/utils';
import type { PropsWithChildren } from 'react';
import {
	ListItem,
	ListLayout,
	type ListLayoutGetDataParams,
	NewLink,
} from '@/shared/ui/adease';
import type { QuestionPaperWithRelations } from './_lib/types';
import { getQuestionPapers } from './_server/actions';

export default function QuestionPapersLayout({ children }: PropsWithChildren) {
	async function getData({ page, search }: ListLayoutGetDataParams) {
		return getQuestionPapers(page, search);
	}

	return (
		<ListLayout<QuestionPaperWithRelations>
			path='/library/resources/question-papers'
			queryKey={['question-papers']}
			getData={getData}
			actionIcons={[
				<NewLink key='new' href='/library/resources/question-papers/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={getAssessmentTypeLabel(item.assessmentType)}
					description={`${item.module?.code} • ${item.term?.code}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
