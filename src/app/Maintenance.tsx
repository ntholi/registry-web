import './(main)/globals.css';
import Image from 'next/image';

export default function Maintenance() {
  return (
    <div className='min-h-screen bg-neutral-900 text-white'>
      <div className='flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md text-center'>
          <div className='mx-auto mb-8 h-32 overflow-hidden sm:h-40'>
            <Image
              src='/images/logo-dark.png'
              alt='Limkokwing Logo'
              width={160}
              height={160}
              className='h-full w-full object-contain p-4'
              priority
            />
          </div>

          <div className='space-y-4'>
            <h1 className='text-2xl font-light tracking-wide text-white/90 sm:text-3xl'>
              Under Maintenance
            </h1>

            <div className='mx-auto h-px w-16 bg-white/30'></div>

            <p className='text-sm text-white/60 sm:text-base'>
              We are currently performing maintenance on the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
