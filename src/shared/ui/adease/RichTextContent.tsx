import { TypographyStylesProvider } from '@mantine/core';
import parse from 'html-react-parser';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import { isRichTextEmpty } from '@/shared/lib/utils/files';

type Props = {
	html?: string | null;
};

const richTextSanitizeOptions: IOptions = {
	allowedTags: sanitizeHtml.defaults.allowedTags,
	allowedAttributes: {
		...sanitizeHtml.defaults.allowedAttributes,
		a: ['href', 'target', 'rel'],
		p: ['style'],
		h1: ['style'],
		h2: ['style'],
		h3: ['style'],
	},
	allowedStyles: {
		'*': {
			'text-align': [/^left$/, /^center$/, /^right$/, /^justify$/],
		},
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	transformTags: {
		a: sanitizeHtml.simpleTransform('a', {
			rel: 'noopener noreferrer',
		}),
	},
};

export function RichTextContent({ html }: Props) {
	if (!html || isRichTextEmpty(html)) {
		return null;
	}

	const content = sanitizeHtml(html, richTextSanitizeOptions);

	if (isRichTextEmpty(content)) {
		return null;
	}

	return <TypographyStylesProvider>{parse(content)}</TypographyStylesProvider>;
}
