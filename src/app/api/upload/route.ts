import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadBufferToCloudinary(buffer: Buffer, publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || 'ravi_genuine_autos',
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    console.log('Upload endpoint hit');
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary configuration is missing on the server.');
      return NextResponse.json(
        { error: 'Cloudinary is not configured on the Vercel deployment. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables in your Vercel Dashboard.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // 1. Signature Preparation Mode for Client-Side direct uploads
    if (mode === 'prepare') {
      const body = await request.json().catch(() => ({}));
      const folder = body.folder || process.env.CLOUDINARY_FOLDER || 'ravi_genuine_autos';
      const timestamp = Math.round(new Date().getTime() / 1000);

      const paramsToSign = {
        timestamp,
        folder,
      };

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET!
      );

      const params = {
        ...paramsToSign,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY!,
      };

      const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

      return NextResponse.json({
        uploadUrl,
        params,
      });
    }

    // 2. Fallback backend file upload (Memory Buffer upload stream)
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

      const publicId = uuidv4();
      const uploadResult = await uploadBufferToCloudinary(buffer, publicId);
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

