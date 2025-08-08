import StatusPage from '@/components/StatusPage';
import { IconBan } from '@tabler/icons-react';

export default function Forbidden() {
  return (
    <StatusPage
      title='Forbidden'
      description='You don’t have permission to view this page.'
      color='red'
      icon={<IconBan size={32} />}
      primaryActionHref='/'
      primaryActionLabel='Go to dashboard'
    />
  );
}
