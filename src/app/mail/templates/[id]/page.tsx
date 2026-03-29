import { notFound } from 'next/navigation';
import { getMailTemplate } from '../_server/actions';
import TemplateDetail from './_components/TemplateDetail';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function MailTemplateDetailPage({ params }: Props) {
	const { id } = await params;
	const template = await getMailTemplate(id);

	if (!template) return notFound();

	return <TemplateDetail template={template} />;
}
