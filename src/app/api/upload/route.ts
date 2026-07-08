import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    const paths: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract extension
      const originalName = file.name;
      const extension = originalName.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = join(uploadDir, fileName);

      // Write to public folder
      await writeFile(filePath, buffer);
      
      // Return public URL path
      paths.push(`/uploads/${fileName}`);
    }

    return NextResponse.json({ paths });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
