import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure() {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured.");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  configured = true;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadBuffer(buffer: Buffer, folder = "artcanvas"): Promise<UploadResult> {
  configure();
  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteResource(publicId: string): Promise<void> {
  configure();
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error || new Error("Failed to delete resource"));
      if (result?.result !== "ok") return reject(new Error("Cloudinary delete failed"));
      resolve();
    });
  });
}
