import QualificationsUploadForm from './_components/QualificationsUploadForm';
import { prepopulateAcademicRecordsFromCompletedPrograms } from './_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function QualificationsPage({ params }: Props) {
	const { id } = await params;
	await prepopulateAcademicRecordsFromCompletedPrograms(id);
	return <QualificationsUploadForm applicationId={id} />;
}
