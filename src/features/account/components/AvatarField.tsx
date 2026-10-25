import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { isApiError } from '@/shared/api/api-error';
import type { Profile } from '@/shared/contracts/profile';
import { Button } from '@/shared/ui/button';

import { useRemoveAvatar, useUpdateAvatar } from '../hooks/use-profile';
import { AvatarImageError, prepareAvatar } from '../model/avatar-image';

export function AvatarField({ profile }: { profile: Profile }) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const update = useUpdateAvatar(profile.id);
  const remove = useRemoveAvatar(profile.id);
  const isBusy = isProcessing || update.isPending || remove.isPending;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    setIsProcessing(true);
    try {
      const dataUrl = await prepareAvatar(file);
      await update.mutateAsync({ dataUrl });
    } catch (cause) {
      const message =
        cause instanceof AvatarImageError || isApiError(cause)
          ? cause.message
          : 'Não foi possível enviar a imagem.';
      setError(message);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium" id={`${inputId}-label`}>
        Avatar
      </span>
      <div className="flex flex-wrap items-center gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`Avatar de ${profile.displayName}`}
            width={64}
            height={64}
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <UserAvatar user={{ ...profile, avatarUrl: null }} className="size-14 text-base" />
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-labelledby={`${inputId}-label`}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button type="button" size="sm" disabled={isBusy} onClick={() => inputRef.current?.click()}>
          {isBusy ? 'Enviando…' : 'Alterar'}
        </Button>
        {profile.avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() =>
              remove.mutate(undefined, {
                onError: (cause) =>
                  toast.error(
                    isApiError(cause) ? cause.message : 'Não foi possível remover o avatar.',
                  ),
              })
            }
          >
            Remover
          </Button>
        )}
      </div>
      <p className="text-[0.6875rem] text-muted-foreground">
        PNG, JPG ou WebP. A imagem é recortada em quadrado.
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
