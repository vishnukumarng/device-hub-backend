export interface CreateProductRequest {
  name: string;
  category: string;
  serial_no: string;
}

export interface ProductEntity {
  name: string;
  category: string;
  serial_no: string;
  qr_code: string;
  image_path: string;
}
