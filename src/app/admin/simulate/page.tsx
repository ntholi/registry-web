import {
  Container,
  Group,
  Paper,
  Stack,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconTestPipe } from '@tabler/icons-react';
import RegistrationSimulator from './RegistrationSimulator';

export default function SimulatePage() {
  return (
    <Container size='xl' py='lg' px='xl'>
      <Stack gap='xl'>
        <Paper withBorder radius='md' p='lg'>
          <Stack gap='md'>
            <Group gap='xs' align='center'>
              <ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
                <IconTestPipe size={24} />
              </ThemeIcon>
              <Title fw={400} size='h4'>
                Registration Simulator
              </Title>
            </Group>
            <RegistrationSimulator />
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
