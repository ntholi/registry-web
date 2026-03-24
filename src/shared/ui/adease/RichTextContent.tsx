import { Box, type BoxProps, TypographyStylesProvider } from '@mantine/core';
import parse from 'html-react-parser';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import { isRichTextEmpty } from '@/shared/lib/utils/files';

type Props = BoxProps & {
	html?: string | null;
};

const allowedTags = Array.from(
	new Set([
		...sanitizeHtml.defaults.allowedTags,
		'div',
		'span',
		'img',
		'table',
		'thead',
		'tbody',
		'tfoot',
		'tr',
		'th',
		'td',
	])
);

const richTextSanitizeOptions: IOptions = {
	allowedTags,
	allowedAttributes: {
		...sanitizeHtml.defaults.allowedAttributes,
		a: ['href', 'target', 'rel'],
		div: ['style'],
		span: ['style'],
		img: ['src', 'alt', 'title', 'width', 'height'],
		p: ['style'],
		h1: ['style'],
		h2: ['style'],
		h3: ['style'],
		h4: ['style'],
		h5: ['style'],
		h6: ['style'],
		table: ['style', 'border', 'cellpadding', 'cellspacing'],
		thead: ['style'],
		tbody: ['style'],
		tfoot: ['style'],
		tr: ['style'],
		th: ['style', 'colspan', 'rowspan', 'scope'],
		td: ['style', 'colspan', 'rowspan'],
	},
	allowedStyles: {
		'*': {
			'text-align': [/^left$/, /^center$/, /^right$/, /^justify$/],
		},
	},
	allowedSchemes: ['http', 'https', 'mailto'],
};

export function RichTextContent({ html, ...props }: Props) {
	if (!html || isRichTextEmpty(html)) {
		return null;
	}

	const content = sanitizeHtml(html, richTextSanitizeOptions);

	if (isRichTextEmpty(content)) {
		return null;
	}

	return (
		<Box {...props}>
			<TypographyStylesProvider>{parse(content)}</TypographyStylesProvider>
		</Box>
	);
}
