// Currency formatter — Ghanaian Cedi (GH₵)
export function formatCurrency(amount: number | string): string {
  return `GH₵${Number(amount).toFixed(2)}`;
}

export function getProductUnit(productName: string, materialType?: string): string {
  const normalizedName = productName.trim().toLowerCase();
  const normalizedMaterialType = materialType?.trim().toLowerCase();

  if (normalizedName === 'tot bag') {
    return 'pieces';
  }

  if (normalizedName === 'shoe' && normalizedMaterialType === 'fabric') {
    return 'pieces';
  }

  if (normalizedName === 'button' && normalizedMaterialType === 'fabric') {
    return 'pieces';
  }

  if (normalizedName === 'pillow' && normalizedMaterialType === 'fabric') {
    return 'pieces';
  }

  if (normalizedName === 'bedsheet' && normalizedMaterialType === 'fabric') {
    return 'pieces';
  }

  if (normalizedName === 'dustbin' && normalizedMaterialType === 'plastic') {
    return 'pieces';
  }

  if (normalizedName === 'seedling pot' && normalizedMaterialType === 'plastic') {
    return 'pieces';
  }

  if (normalizedName === 'pencil collector' && normalizedMaterialType === 'plastic') {
    return 'pieces';
  }

  return 'kg';
}

// Material-type → curated Unsplash photo IDs
const MATERIAL_IMAGES: Record<string, string[]> = {
  plastic: [
    'https://images.unsplash.com/photo-1583781049047-279d52efdb96?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604187352259-b9f23c1f8d26?w=600&auto=format&fit=crop',
  ],
  plastics: [
    'https://images.unsplash.com/photo-1583781049047-279d52efdb96?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604187352259-b9f23c1f8d26?w=600&auto=format&fit=crop',
  ],
  metal: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=600&auto=format&fit=crop',
  ],
  metals: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=600&auto=format&fit=crop',
  ],
  fabric: [
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop',
  ],
  textiles: [
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop',
  ],
  other: [
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=600&auto=format&fit=crop',
  ],
};

/**
 * Returns a deterministic Unsplash image URL for a product.
 * Uses materialType to pick the relevant category and productId to vary the image.
 */
export function getProductImage(
  materialType: string,
  productId?: number,
  uploadedImage?: string | null
): string {
  if (uploadedImage) {
    return uploadedImage.startsWith('/') ? uploadedImage : `/uploads/${uploadedImage}`;
  }
  const pool = MATERIAL_IMAGES[materialType?.toLowerCase()] ?? MATERIAL_IMAGES.other;
  const index = productId ? (productId - 1) % pool.length : 0;
  return pool[index];
}
