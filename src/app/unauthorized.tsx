import { IconLock } from '@tabler/icons-react';
import StatusPage from '@/shared/ui/StatusPage';

export default function Unauthorized() {
	return (
		<StatusPage
			title='Unauthorized'
			description='You need to sign in to access this page.'
			color='yellow'
			icon={<IconLock size={32} />}
			primaryActionHref='/auth/login'
			primaryActionLabel='Sign in'
		/>
	);
}
