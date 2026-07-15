export async function uploadImageToCloudinary(file: File): Promise<string> {
  try {
    const prepareResponse = await fetch('/api/upload?mode=prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || process.env.CLOUDINARY_FOLDER || 'ravi_genuine_autos',
      }),
    });

    if (prepareResponse.ok) {
      const prepared = await prepareResponse.json();
      if (prepared?.uploadUrl && prepared?.params) {
        const uploadFormData = new FormData();
        Object.entries(prepared.params as Record<string, string>).forEach(([key, value]) => {
          uploadFormData.append(key, value);
        });
        uploadFormData.append('file', file);

        const uploadResponse = await fetch(prepared.uploadUrl, {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          if (result?.secure_url) {
            return result.secure_url;
          }
        }
      }
    }
  } catch (error) {
    console.error('Direct Cloudinary upload failed, falling back to legacy route:', error);
  }

  const fallbackFormData = new FormData();
  fallbackFormData.append('files', file);

  const fallbackResponse = await fetch('/api/upload', {
    method: 'POST',
    body: fallbackFormData,
    credentials: 'include',
  });

  if (!fallbackResponse.ok) {
    const errorPayload = await fallbackResponse.json().catch(() => ({}));
    throw new Error(errorPayload.error || 'Image upload failed');
  }

  const fallbackData = await fallbackResponse.json();
  const paths = fallbackData.paths || [];
  if (!paths.length) {
    throw new Error('No images were uploaded');
  }

  return paths[0];
}

export async function uploadImagesToCloudinary(files: File[]): Promise<string[]> {
  const uploads = await Promise.all(files.map((file) => uploadImageToCloudinary(file)));
  return uploads.filter(Boolean);
}
