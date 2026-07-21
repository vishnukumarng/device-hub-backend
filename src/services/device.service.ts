import crypto from "crypto";
import * as deviceRepository from "../repositories/device.repositories";
import { CreateDeviceRequest, DeviceEntity } from "../types/device.type";
import { ConflictError } from "../utils/AppError";
import { generateQrSvg } from "../utils/qrcode.util";
import { uploadSvgToCloudinary } from "../utils/cloudinaryUpload.util";

export const addDevice = async (data: CreateDeviceRequest) => {
  const existingDevice = await deviceRepository.findBySerialNumber(
    data.serial_no,
  );

  if (existingDevice) {
    throw new ConflictError("Device already exists");
  }

  const qr_code = crypto.randomUUID();
  const image_url = "/demo.jpg";

  const qrSvg = await generateQrSvg(qr_code);
  const qr_image_url = await uploadSvgToCloudinary(qrSvg, `qr-${qr_code}`);

  const devicedata: DeviceEntity = {
    ...data,
    qr_code,
    image_url,
    qr_image_url,
  };

  const device = await deviceRepository.createDevice(devicedata);

  return {
    id: device.id,
    name: device.name,
    category: device.category,
    serial_no: device.serial_no,
    qr_code: device.qr_code,
    status: device.status,
    image_url: device.image_url,
    qr_image_url: device.qr_image_url,
  };
};
