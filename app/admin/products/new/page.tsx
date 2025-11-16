import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
  const publicCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let cloudName: string | undefined = publicCloud;
  if (!cloudName && cloudinaryUrl.includes("@")) {
    cloudName = cloudinaryUrl.split("@").pop()?.split("/")[0];
  }
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "habita-studio";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Nuevo Producto</h1>
      <ProductForm cloudName={cloudName} uploadPreset={uploadPreset} />
    </div>
  );
}

