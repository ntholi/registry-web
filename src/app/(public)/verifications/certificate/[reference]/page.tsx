import {
  Alert,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCertificate, IconInfoCircle } from '@tabler/icons-react';
import Logo from '../../../../../components/Logo';

type Props = {
  params: Promise<{ reference: string }>;
};

export default async function CertificateVerificationPage({ params }: Props) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Container size='sm' p='xl'>
        <Stack align='center' mb='xl'>
          <Logo height={96} />
          <Group gap='xs' align='center'>
            <Title order={1} fw={300} ta='center'>
              Certificate Verification
            </Title>
          </Group>
        </Stack>

        <Alert
          variant='light'
          color='blue'
          title='Coming Soon'
          icon={<IconInfoCircle size={20} />}
          mb='xl'
        >
          <Text size='sm'>
            The certificate verification system is currently under development
            and will be available soon.
          </Text>
        </Alert>

        <Stack gap='lg'>
          <Paper withBorder shadow='sm' p='xl'>
            <Stack gap='xl' align='center'>
              <ThemeIcon size={80} radius='xl' variant='light' color='blue'>
                <IconCertificate size={40} />
              </ThemeIcon>

              <Stack gap='md' align='center'>
                <Title order={2} fw={400} ta='center'>
                  Launching October 27, 2025
                </Title>

                <Divider w={64} />

                <Text size='md' ta='center' c='dimmed' maw={500}>
                  Our new certificate verification system will allow you to
                  instantly verify the authenticity of academic certificates
                  issued by Limkokwing University.
                </Text>
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Stack align='center' mt='xl' gap='xs'>
          <Divider w={64} />
          <Text size='sm' c='dimmed' ta='center'>
            Limkokwing University of Creative Technology
          </Text>
        </Stack>
      </Container>
    </div>
  );
}
