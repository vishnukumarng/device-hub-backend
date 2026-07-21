import { DeviceStatus } from "@prisma/client";

export interface CreateDeviceRequest {
  name: string;
  category: string;
  serial_no: string;
}

export interface DeviceEntity {
  name: string;
  category: string;
  serial_no: string;
  qr_code: string;
  image_url: string;
  status?: DeviceStatus;
}
