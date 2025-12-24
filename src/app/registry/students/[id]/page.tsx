import { getStudent, StudentTabs, StudentView } from '@registry/students';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const student = await getStudent(Number(id));

	return {
		title: `${student?.name} | Limkokwing`,
	};
}

export default async function StudentDetails({ params }: Props) {
	const { id } = await params;
	const student = await getStudent(Number(id));

	if (!student) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader title={student.name} queryKey={['students']} />
			<StudentTabs student={student}>
				<StudentView student={student} />
			</StudentTabs>
		</DetailsView>
	);
}
