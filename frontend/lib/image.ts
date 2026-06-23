/**
 * Optimizes an image file by converting it to WebP format and resizing if necessary.
 * @param file The original image file
 * @param quality Quality of the output WebP (0 to 1)
 * @param maxWidth Maximum width of the output image
 * @returns A promise that resolves to the optimized Blob
 */
export async function optimizeImage(
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if width exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads a file using a presigned URL.
 * @param file The file or blob to upload
 * @param uploadUrl The presigned URL from the backend
 * @param contentType The content type of the file
 */
export async function uploadToR2(
  file: File | Blob,
  uploadUrl: string,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

/**
 * High-level helper to optimize and upload an image to R2.
 */
export async function uploadImage(
  file: File,
  options: {
    folder: "logos" | "headers" | "menu-items" | "general";
    quality?: number;
    maxWidth?: number;
    client: any; // Encore client
  }
): Promise<string> {
  const { folder, quality = 0.8, maxWidth = 1920, client } = options;

  // 1. Optimize
  const optimizedBlob = await optimizeImage(file, quality, maxWidth);

  // 2. Get Upload URL
  const fileName = `${file.name.replace(/\.[^/.]+$/, "")}.webp`;
  const { uploadUrl, publicUrl } = await client.storage.getUploadURL({
    fileName,
    contentType: "image/webp",
    folder,
  });

  // 3. Upload
  await uploadToR2(optimizedBlob, uploadUrl, "image/webp");

  return publicUrl;
}

/**
 * Uploads a blob directly to R2.
 */
export async function uploadBlob(
  blob: Blob,
  fileName: string,
  options: {
    folder: "logos" | "headers" | "menu-items" | "general";
    client: any;
  }
): Promise<string> {
  const { folder, client } = options;

  // 1. Get Upload URL
  const { uploadUrl, publicUrl } = await client.storage.getUploadURL({
    fileName,
    contentType: blob.type,
    folder,
  });

  // 2. Upload
  await uploadToR2(blob, uploadUrl, blob.type);

  return publicUrl;
}
