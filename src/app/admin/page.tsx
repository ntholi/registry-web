import { Stack, Title } from '@mantine/core';
import ActiveTermDisplay from './base/ActiveTermDisplay';
import RoleDisplay from './base/RoleDisplay';

export default function AdminPage() {
  return (
    <Stack h={'70vh'} w={'100%'} justify='center' align='center'>
      <div>
        <RoleDisplay />
        <ActiveTermDisplay />
      </div>
    </Stack>
  );
}
