'use client';

import { getAssessmentTypeLabel } from '@academic/assessments/_lib/utils';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { QuestionPaperWithRelations } from './_lib/types';
import { getQuestionPapers } from './_server/actions';

export default function QuestionPapersLayout({ children }: PropsWithChildren) {
	async function getData(page: number, search: string) {
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
					label={item.title}
					description={`${item.module?.code} • ${item.term?.code} • ${getAssessmentTypeLabel(item.assessmentType)}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
