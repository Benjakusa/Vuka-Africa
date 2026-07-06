import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@backend/lib/env';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';
import { validateFile, checkMagicBytes, sanitizeFilename } from '@backend/lib/file-validation';
import { rateLimitByUser } from '@backend/middleware/rate-limit';

const r2Client = env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ENDPOINT
  ? new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    await rateLimitByUser(req, auth.id, 'upload', { max: 20, windowMs: 60000 });

    if (!r2Client) {
      throw new ValidationError('File upload is not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const purpose = (formData.get('purpose') as string) || 'general';

    if (!file) {
      throw new ValidationError('No file provided');
    }

    const allowedMimes = env.ALLOWED_MIME_TYPES.split(',');
    validateFile({ name: file.name, type: file.type, size: file.size }, allowedMimes);

    const buffer = Buffer.from(await file.arrayBuffer());

    const magicValid = checkMagicBytes(new Uint8Array(buffer), file.type);
    if (!magicValid) {
      throw new ValidationError('File content does not match its declared type');
    }

    const safeFilename = sanitizeFilename(file.name);
    const purposePrefix = purpose === 'avatar' ? 'avatars' : purpose === 'verification' ? 'verification' : 'uploads';
    const key = `${purposePrefix}/${auth.id}/${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        uploadedBy: auth.id,
        uploadedAt: new Date().toISOString(),
        originalName: file.name.slice(0, 200),
      },
    });

    await r2Client.send(command);

    const publicUrl = env.R2_PUBLIC_URL
      ? `${env.R2_PUBLIC_URL}/${key}`
      : `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}`;

    return success({ url: publicUrl, key });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    if (!r2Client) {
      throw new ValidationError('File upload is not configured');
    }

    const url = new URL(req.url);
    const fileName = url.searchParams.get('fileName') || 'upload';
    const contentType = url.searchParams.get('contentType') || 'application/octet-stream';
    const purpose = url.searchParams.get('purpose') || 'general';

    const allowedMimes = env.ALLOWED_MIME_TYPES.split(',');
    if (!allowedMimes.includes(contentType)) {
      throw new ValidationError(`File type "${contentType}" not allowed`);
    }

    const safeFilename = sanitizeFilename(fileName);
    const purposePrefix = purpose === 'avatar' ? 'avatars' : purpose === 'verification' ? 'verification' : 'uploads';
    const key = `${purposePrefix}/${auth.id}/${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        uploadedBy: auth.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    const publicUrl = env.R2_PUBLIC_URL
      ? `${env.R2_PUBLIC_URL}/${key}`
      : `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}`;

    return success({ uploadUrl, publicUrl, key });
  } catch (err) {
    return handleError(err);
  }
}
