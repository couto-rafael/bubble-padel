import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function signParams(folder: string): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? "bubble_athlete_sponsors";
  const toSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    folder,
    uploadPreset,
  };
}

export async function destroyAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
