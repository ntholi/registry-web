import { render } from '@react-email/render';
import { createElement } from 'react';
import sanitize from 'sanitize-html';
import GenericEmail from './GenericEmail';
import NotificationEmail from './NotificationEmail';
import StudentStatusEmail, {
	getStudentStatusSubject,
} from './StudentStatusEmail';

type RenderedEmail = {
	html: string;
	text: string;
	subject: string;
};

type StudentStatusProps = {
	studentName: string;
	stdNo: string;
	statusType: string;
	action: 'created' | 'updated' | 'approved' | 'rejected';
	reason?: string;
	approverName?: string;
	portalUrl: string;
};

type NotificationProps = {
	title: string;
	message: string;
	link?: string;
	senderName?: string;
};

type GenericProps = {
	heading: string;
	body: string;
	ctaText?: string;
	ctaUrl?: string;
};

export async function renderStudentStatusEmail(
	props: StudentStatusProps
): Promise<RenderedEmail> {
	const element = createElement(StudentStatusEmail, props);
	const [html, text] = await Promise.all([
		render(element),
		render(element, { plainText: true }),
	]);
	return {
		html,
		text,
		subject: getStudentStatusSubject(props.action, props.statusType),
	};
}

export async function renderNotificationEmail(
	props: NotificationProps
): Promise<RenderedEmail> {
	const element = createElement(NotificationEmail, props);
	const [html, text] = await Promise.all([
		render(element),
		render(element, { plainText: true }),
	]);
	return { html, text, subject: props.title };
}

export async function renderGenericEmail(
	props: GenericProps
): Promise<RenderedEmail> {
	const element = createElement(GenericEmail, {
		...props,
		body: sanitize(props.body),
	});
	const [html, text] = await Promise.all([
		render(element),
		render(element, { plainText: true }),
	]);
	return { html, text, subject: props.heading };
}
