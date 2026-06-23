import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = secret("R2AccessKeyId");
const secretAccessKey = secret("R2SecretAccessKey");
const endpoint = secret("R2Endpoint");
const bucketName = secret("R2BucketName");
const publicUrl = secret("R2PublicUrl");

const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint().trim(),
  credentials: {
    accessKeyId: accessKeyId().trim(),
    secretAccessKey: secretAccessKey().trim(),
  },
});

console.log("[Storage] S3 Client initialized with endpoint:", endpoint().trim());

export interface GetUploadURLRequest {
  fileName: string;
  contentType: string;
  folder?: string; // e.g. 'logos', 'headers', 'menu-items'
}

export interface GetUploadURLResponse {
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Generates a presigned URL for uploading a file to Cloudflare R2.
 */
export const getUploadURL = api(
  { method: "POST", path: "/storage/upload-url", expose: true },
  async (req: GetUploadURLRequest): Promise<GetUploadURLResponse> => {
    try {
      const folder = req.folder ? `${req.folder.replace(/\/$/, "")}/` : "uploads/";
      const key = `${folder}${Date.now()}-${req.fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: bucketName(),
        Key: key,
        ContentType: req.contentType,
      });

      // URL expires in 1 hour
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        uploadUrl,
        publicUrl: `${publicUrl()}/${key}`,
      };
    } catch (err: any) {
      console.error("getUploadURL error:", err);
      throw APIError.internal(err.message || "Failed to generate upload URL");
    }
  }
);

export interface UploadBufferRequest {
  buffer: string; // Base64 encoded buffer
  fileName: string;
  contentType: string;
  folder?: string;
}

/**
 * Directly uploads a buffer to R2 (internal use)
 */
export const uploadBufferInternal = api(
  { method: "POST", path: "/storage/upload-buffer", expose: false },
  async (req: UploadBufferRequest): Promise<{ publicUrl: string }> => {
    const buffer = Buffer.from(req.buffer, "base64");
    const url = await uploadBuffer(buffer, req.fileName, req.contentType, req.folder);
    return { publicUrl: url };
  }
);

/**
 * Directly uploads a buffer to R2 (internal use)
 */
export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "uploads"
): Promise<string> {
  const cleanFolder = folder.replace(/\/$/, "");
  const key = `${cleanFolder}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `${publicUrl()}/${key}`;
}
