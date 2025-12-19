'use client';

import { getQuestionTypeColor } from '@student-portal/utils';
import {
	IconCheck,
	IconCircleNumber1,
	IconHash,
	IconLetterA,
	IconTextCaption,
} from '@tabler/icons-react';

export type QuestionTypeInfo = {
	label: string;
	color: string;
	icon: React.ReactNode;
};

const QUESTION_TYPE_CONFIG: Record<
	string,
	{ label: string; icon: React.ReactNode }
> = {
	multichoice: { label: 'Multiple Choice', icon: <IconLetterA size={14} /> },
	truefalse: { label: 'True/False', icon: <IconCheck size={14} /> },
	shortanswer: { label: 'Short Answer', icon: <IconTextCaption size={14} /> },
	essay: { label: 'Essay', icon: <IconTextCaption size={14} /> },
	numerical: { label: 'Numerical', icon: <IconHash size={14} /> },
	match: { label: 'Matching', icon: <IconCircleNumber1 size={14} /> },
	description: { label: 'Description', icon: <IconTextCaption size={14} /> },
};

export function getQuestionTypeInfo(qtype: string): QuestionTypeInfo {
	const config = QUESTION_TYPE_CONFIG[qtype];
	return {
		label: config?.label ?? qtype,
		color: getQuestionTypeColor(qtype),
		icon: config?.icon ?? <IconCircleNumber1 size={14} />,
	};
}

export function stripHtml(html: string): string {
	const div =
		typeof document !== 'undefined' ? document.createElement('div') : null;
	if (div) {
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	}
	return html.replace(/<[^>]*>/g, '');
}
