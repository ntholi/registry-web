'use client';
import { deleteDocument, uploadDocument } from '@/lib/storage';
import { getStudent, getStudentPhoto } from '@/server/students/actions';
import { ActionIcon, Card, Center } from '@mantine/core';
import { IconUpload, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import PhotoInputModal from './PhotoInputModal';
import PhotoPreviewModal from './PhotoPreviewModal';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function PhotoView({ student }: Props) {
  const { data: photoUrl, refetch } = useQuery({
    queryKey: ['studentPhoto', student.stdNo],
    queryFn: () => getStudentPhoto(student.stdNo),
    staleTime: 1000 * 60 * 3,
  });
  const { data: session } = useSession();

  const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
    if (photoUrl) {
      await deleteDocument(photoUrl);
    }

    const fileName = `${student.stdNo}.jpg`;
    const photoFile = new File([croppedImageBlob], fileName, {
      type: 'image/jpeg',
    });

    await uploadDocument(photoFile, fileName);
    await refetch();
  };

  const cardContent = (
    <Center h='100%'>
      <IconUser size='2rem' />
    </Center>
  );

  return (
    <>
      <div style={{ position: 'relative' }}>
        {photoUrl ? (
          <PhotoPreviewModal
            photoUrl={photoUrl}
            title={`${student.name} (${student.stdNo})`}
            alt='Student photo'
            width={76}
            height={76}
          />
        ) : (
          <>
            <Card withBorder radius={'md'} w={76} h={76} p={'xs'}>
              {cardContent}
            </Card>
            {['admin', 'registry'].includes(session?.user?.role ?? '') && (
              <PhotoInputModal
                onPhotoSubmit={handlePhotoSubmit}
                title={`Upload Photo for ${student.name}`}
                renderTrigger={({ open }) => (
                  <ActionIcon
                    size='sm'
                    style={{
                      position: 'absolute',
                      opacity: 0.7,
                      top: 4,
                      right: 4,
                      zIndex: 1,
                    }}
                    onClick={open}
                    title={photoUrl ? 'Change photo' : 'Upload photo'}
                  >
                    <IconUpload size='0.8rem' />
                  </ActionIcon>
                )}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
