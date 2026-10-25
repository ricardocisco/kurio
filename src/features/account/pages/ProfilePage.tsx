import { useSession } from '@/features/auth/hooks/use-session';
import { isApiError } from '@/shared/api/api-error';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';

import { PasswordForm } from '../components/PasswordForm';
import { ProfileForm } from '../components/ProfileForm';
import { useProfile } from '../hooks/use-profile';

export function ProfilePage() {
  const { user } = useSession();
  const profile = useProfile(user?.id ?? 'guest');

  return (
    <section aria-labelledby="account-profile-title" className="flex flex-col gap-8">
      <h1 id="account-profile-title" className="sr-only">
        Dados do perfil
      </h1>
      {profile.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : profile.isError ? (
        <StatusMessage
          variant="error"
          title="Não foi possível carregar seu perfil"
          description={isApiError(profile.error) ? profile.error.message : undefined}
          action={
            <RetryButton onRetry={() => void profile.refetch()} isRetrying={profile.isRefetching} />
          }
        />
      ) : (
        <>
          <ProfileForm key={profile.data.id} profile={profile.data} />
          <Separator />
          <PasswordForm />
        </>
      )}
    </section>
  );
}
