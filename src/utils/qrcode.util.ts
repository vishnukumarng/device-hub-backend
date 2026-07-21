import qrcode from "qrcode";

export const generateQrSvg = async (value: string): Promise<string> => {
  return qrcode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "H",
  });
};
