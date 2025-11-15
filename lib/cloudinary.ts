// @ts-ignore - Cloudinary v1 types resolution issue
import { v2 as cloudinary } from "cloudinary";

cloudinary.config(process.env.CLOUDINARY_URL ?? "");

export { cloudinary };

/**
 * Sube una imagen a Cloudinary desde un File o una URL
 */
export async function uploadImage(
  file: File | string,
  folder: string = "habita-studio"
): Promise<string> {
  try {
    if (typeof file === "string") {
      // Si es una URL, subir desde URL
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: "image",
      });
      return result.secure_url;
    } else {
      // Si es un File, convertir a base64 y subir
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: "image",
      });
      return result.secure_url;
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Failed to upload image");
  }
}

/**
 * Sube múltiples imágenes a Cloudinary
 */
export async function uploadImages(
  files: File[],
  folder: string = "habita-studio"
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading images to Cloudinary:", error);
    throw new Error("Failed to upload images");
  }
}

/**
 * Elimina una imagen de Cloudinary usando su public_id
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Failed to delete image");
  }
}

/**
 * Extrae el public_id de una URL de Cloudinary
 * Formato: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    // Buscar el índice de "upload" en la URL
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) {
      return null;
    }

    // Extraer la parte después de "/upload/"
    const afterUpload = url.substring(uploadIndex + "/upload/".length);

    // Remover cualquier transformación (ej: v1234567890, w_500, etc.)
    // Las transformaciones están antes del último "/" o son parte del nombre del archivo
    let publicId = afterUpload;

    // Si hay versiones o transformaciones, extraer solo el public_id
    // Formato puede ser: v1234567890/folder/public_id.jpg o folder/public_id.jpg
    const versionMatch = publicId.match(/^v\d+\/(.+)$/);
    if (versionMatch) {
      publicId = versionMatch[1];
    }

    // Remover la extensión del archivo
    const lastDotIndex = publicId.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      publicId = publicId.substring(0, lastDotIndex);
    }

    return publicId || null;
  } catch (error) {
    console.error("Error extracting public_id from URL:", error);
    return null;
  }
}

