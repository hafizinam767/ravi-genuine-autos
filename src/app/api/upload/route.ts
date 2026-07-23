import { NextResponse } from 'next/server';
import { writeFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadBufferToCloudinary(buffer: Buffer, publicId: string, extension: string) {
  const tempFileName = `${publicId}.${extension}`;
  const tempFilePath = join(tmpdir(), tempFileName);
  await writeFile(tempFilePath, buffer);

  try {
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: process.env.CLOUDINARY_FOLDER || 'ravi_genuine_autos',
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
    });
    return result;
  } finally {
    await unlink(tempFilePath).catch(() => {});
  }
}

function extractExtension(fileName: string, mimeType: string) {
  const match = fileName.match(/\.([^.]+)$/);
  if (match?.[1]) return match[1].toLowerCase();
  const parts = mimeType.split('/');
  return parts[1] || 'jpg';
}

export async function POST(request: Request) {
  try {
    console.log('Upload endpoint hit');
    console.log('Content-Type:', request.headers.get('content-type'));

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    console.log('Parsed files count:', files.length);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const paths: string[] = [];

    for (const file of files) {
      console.log('File info:', {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      console.log('Buffer first bytes:', buffer.slice(0, 16).toString('hex'));

      const publicId = uuidv4();
      const extension = extractExtension(file.name, file.type);
      console.log('Derived extension:', extension);

      const uploadResult = await uploadBufferToCloudinary(buffer, publicId, extension);
      paths.push(uploadResult.secure_url);
    }

    return NextResponse.json({ paths });
  } catch (error) {
    console.error('Upload API Error:', error);
    if (error instanceof Error) {
      console.error('Upload API Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}

