import { getProduct } from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);

  if (!product) {
    notFound();
  }

  // Resolver cloudName desde variables de entorno (preferir pública si existe)
  const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
  const publicCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let cloudName: string | undefined = publicCloud;
  if (!cloudName && cloudinaryUrl.includes("@")) {
    cloudName = cloudinaryUrl.split("@").pop()?.split("/")[0];
  }
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "habita-studio";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Producto</h1>
      <ProductForm product={product} cloudName={cloudName} uploadPreset={uploadPreset} categories={categories} />
    </div>
  );
}

