import { notFound } from 'next/navigation';
import { getLetterTemplate } from '../../_server/actions';
import TemplateDetail from './TemplateDetail';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function TemplateDetailPage({ params }: Props) {
	const { id } = await params;
	const template = await getLetterTemplate(id);

	if (!template) return notFound();

	return <TemplateDetail template={template} />;
}
