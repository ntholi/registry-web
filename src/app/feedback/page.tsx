import { unwrap } from '@/shared/lib/utils/actionResult';
import AlreadySubmitted from './_components/AlreadySubmitted';
import ExpiredCycle from './_components/ExpiredCycle';
import FeedbackForm from './_components/FeedbackForm';
import PassphraseEntry from './_components/PassphraseEntry';
import {
	getFeedbackDataForPassphrase,
	validateFeedbackPassphrase,
} from './_server/actions';

type Props = {
	searchParams: Promise<{ passphrase?: string }>;
};

export default async function FeedbackPage({ searchParams }: Props) {
	const { passphrase } = await searchParams;

	if (!passphrase) {
		return <PassphraseEntry />;
	}

	const decoded = decodeURIComponent(passphrase).replace(/\+/g, ' ');
	const result = unwrap(await validateFeedbackPassphrase(decoded));
	if ('error' in result) {
		return (
			<PassphraseEntry error='Invalid passphrase. Please check and try again.' />
		);
	}

	if (result.cycleStatus === 'closed') {
		return (
			<ExpiredCycle cycleName={result.cycleName} endDate={result.endDate} />
		);
	}

	if (result.cycleStatus === 'upcoming') {
		return <PassphraseEntry error='This feedback cycle has not started yet.' />;
	}

	if (result.used) {
		return <AlreadySubmitted />;
	}

	const data = unwrap(
		await getFeedbackDataForPassphrase(
			result.structureSemesterId,
			result.termId,
			result.passphraseId
		)
	);

	return (
		<FeedbackForm
			passphraseId={result.passphraseId}
			cycleName={result.cycleName}
			lecturers={data.lecturers}
			questions={data.questions}
			existingResponses={data.existingResponses}
		/>
	);
}
