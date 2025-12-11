'use client';

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

export function getQuestionTypeInfo(qtype: string): QuestionTypeInfo {
	switch (qtype) {
		case 'multichoice':
			return {
				label: 'Multiple Choice',
				color: 'blue',
				icon: <IconLetterA size={14} />,
			};
		case 'truefalse':
			return {
				label: 'True/False',
				color: 'green',
				icon: <IconCheck size={14} />,
			};
		case 'shortanswer':
			return {
				label: 'Short Answer',
				color: 'orange',
				icon: <IconTextCaption size={14} />,
			};
		case 'essay':
			return {
				label: 'Essay',
				color: 'violet',
				icon: <IconTextCaption size={14} />,
			};
		case 'numerical':
			return {
				label: 'Numerical',
				color: 'cyan',
				icon: <IconHash size={14} />,
			};
		case 'match':
			return {
				label: 'Matching',
				color: 'teal',
				icon: <IconCircleNumber1 size={14} />,
			};
		case 'description':
			return {
				label: 'Description',
				color: 'gray',
				icon: <IconTextCaption size={14} />,
			};
		default:
			return {
				label: qtype,
				color: 'gray',
				icon: <IconCircleNumber1 size={14} />,
			};
	}
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
