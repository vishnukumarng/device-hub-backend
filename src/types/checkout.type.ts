export interface CreateCheckoutDTO {
  deviceId: string;
  expectedReturnTime?: string | Date;
}

export interface ReturnCheckoutDTO {
  // Can be extended if extra fields are needed upon returning
}
