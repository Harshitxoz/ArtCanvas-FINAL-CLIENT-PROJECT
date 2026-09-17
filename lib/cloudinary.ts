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

export async function uploadBuffer(buffer: Buffer, folder = "artcanvas") {
  configure();
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error || !result) return reject(error || new Error("Upload failed"));
      resolve({ secure_url: result.secure_url });
    });
    stream.end(buffer);
  });
}
