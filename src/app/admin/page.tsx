import { Stack, Title } from '@mantine/core';
import ActiveTermDisplay from './base/ActiveTermDisplay';

export default function AdminPage() {
  return (
    <Stack h={'70vh'} w={'100%'} justify='center' align='center'>
      <div>
        <Title fw={'lighter'}>Admin Panel</Title>
        <ActiveTermDisplay />
      </div>
    </Stack>
  );
}
