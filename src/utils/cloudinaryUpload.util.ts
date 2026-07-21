import { cloudinary } from "../config/cloudinary";

export const uploadSvgToCloudinary = async (
  svgString: string,
  publicId: string,
): Promise<string> => {
  const base64Svg = Buffer.from(svgString).toString("base64");
  const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
    folder: "device-qr-codes",
    public_id: publicId,
  });

  return result.secure_url;
};
