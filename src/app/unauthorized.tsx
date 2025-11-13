import { IconLock } from '@tabler/icons-react';
import StatusPage from '@/shared/components/StatusPage';

export default function Unauthorized() {
	return (
		<StatusPage
			title='Unauthorized'
			description='You need to sign in to access this page.'
			color='yellow'
			icon={<IconLock size={32} />}
			primaryActionHref='/login'
			primaryActionLabel='Sign in'
		/>
	);
}
