import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';

export default async function ApplyNewPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login?callbackUrl=/apply/new');
	}

	redirect(`/apply/wizard/documents`);
}
