'use client';

import { Card, Center, Image, Modal, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

type PhotoPreviewModalProps = {
  photoUrl: string;
  title: string;
  alt?: string;
  width?: number;
  height?: number;
};

export default function PhotoPreviewModal({
  photoUrl,
  title,
  alt = 'Photo',
  width = 76,
  height = 76,
}: PhotoPreviewModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        title={title}
        opened={opened}
        onClose={close}
        size='lg'
        radius='md'
        centered
      >
        <Center>
          <Image
            src={photoUrl}
            alt={alt}
            fit='contain'
            h={'100%'}
            radius={'md'}
            w={'98%'}
          />
        </Center>
      </Modal>

      <UnstyledButton onClick={open}>
        <Card withBorder radius={'md'} w={width} h={height} p={'xs'}>
          <Card.Section>
            <Image
              src={photoUrl}
              alt={alt}
              w='100%'
              h='100%'
              fit='cover'
              radius={0}
              style={{ border: '1px solid #000' }}
            />
          </Card.Section>
        </Card>
      </UnstyledButton>
    </>
  );
}
