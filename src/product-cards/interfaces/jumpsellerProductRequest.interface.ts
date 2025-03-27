//Jumpseller request
export interface JumpsellerProductRequest {
  name: string; 
  description: string; 
  price: number; 
  stock: number; 
  sku?: string; 
  weight?: number; 
  images?:JumpsellerImages[]; 
  categories?: JumpSellerCategories[];
  variants?: JumpsellerVariants[];
  brand?: string; 
  status?: string; 
}

export interface JumpSellerCategories {
  name: string;
  id: number;
}

export interface JumpsellerImages {
  url: string;
  position: number;
}

export interface JumpsellerVariants {
  sku?: string;
}