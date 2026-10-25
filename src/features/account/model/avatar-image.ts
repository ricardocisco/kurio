import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/shared/contracts/profile';

const AVATAR_SIZE = 256;

export class AvatarImageError extends Error {}

function isSupported(type: string): type is (typeof AVATAR_MIME_TYPES)[number] {
  return (AVATAR_MIME_TYPES as readonly string[]).includes(type);
}

export async function prepareAvatar(file: File): Promise<string> {
  if (!isSupported(file.type)) throw new AvatarImageError('Envie uma imagem PNG, JPG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new AvatarImageError('A imagem deve ter no máximo 5 MB.');

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new AvatarImageError('Não foi possível processar a imagem.');
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/webp', 0.85);
  if (dataUrl.length * 0.75 > AVATAR_MAX_BYTES) {
    throw new AvatarImageError('A imagem ficou grande demais. Tente outra imagem.');
  }
  return dataUrl;
}
