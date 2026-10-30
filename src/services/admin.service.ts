import crypto from "crypto";
import { prisma } from "../config/prisma";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/AppError";
import { generateQrSvg } from "../utils/qrcode.util";
import { uploadSvgToCloudinary } from "../utils/cloudinaryUpload.util";
import { DeviceStatus, UserRole } from "@prisma/client";

export const getDashboardStats = async () => {
  const now = new Date();

  const [
    totalDevices,
    availableDevices,
    inUseDevices,
    maintenanceDevices,
    retiredDevices,
    reservedDevices,
    activeCheckouts,
    activeReservations,
    waitlistCount,
    totalUsers,
    devices,
    recentActivity,
  ] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: "AVAILABLE" } }),
    prisma.device.count({ where: { status: "IN_USE" } }),
    prisma.device.count({ where: { status: "MAINTENANCE" } }),
    prisma.device.count({ where: { status: "RETIRED" } }),
    prisma.device.count({ where: { status: "RESERVED" } }),
    prisma.checkout.count({ where: { status: "ACTIVE", type: "CHECKOUT" } }),
    prisma.checkout.count({ where: { status: "ACTIVE", type: "RESERVATION" } }),
    prisma.waitlist.count({ where: { status: { in: ["PENDING", "NOTIFIED"] } } }),
    prisma.user.count(),
    prisma.device.findMany({ select: { category: true } }),
    prisma.checkout.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        device: { select: { id: true, name: true, category: true, serial_no: true } },
      },
    }),
  ]);

  // Calculate overdue checkouts
  const overdueCount = await prisma.checkout.count({
    where: {
      status: "ACTIVE",
      type: "CHECKOUT",
      expectedReturnTime: { lt: now },
    },
  });

  // Calculate category breakdown
  const categoryMap: Record<string, number> = {};
  for (const d of devices) {
    const cat = d.category ? d.category.toUpperCase() : "OTHER";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  }
  const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
    category,
    count,
  }));

  return {
    metrics: {
      totalDevices,
      availableDevices,
      inUseDevices,
      maintenanceDevices,
      retiredDevices,
      reservedDevices,
      activeCheckouts,
      activeReservations,
      overdueCount,
      waitlistCount,
      totalUsers,
    },
    categoryBreakdown,
    recentActivity,
  };
};

export const getAllDevicesForAdmin = async () => {
  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      checkouts: {
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      waitlist: {
        where: { status: { in: ["PENDING", "NOTIFIED"] } },
        select: { id: true },
      },
    },
  });

  return devices.map((device) => {
    const activeCheckout = device.checkouts[0] ?? null;
    const now = new Date();
    const isOverdue =
      activeCheckout &&
      activeCheckout.type === "CHECKOUT" &&
      new Date(activeCheckout.expectedReturnTime) < now;

    return {
      id: device.id,
      name: device.name,
      category: device.category,
      serial_no: device.serial_no,
      qr_code: device.qr_code,
      image_url: device.image_url,
      qr_image_url: device.qr_image_url,
      status: device.status,
      createdAt: device.createdAt,
      activeCheckout: activeCheckout
        ? {
            id: activeCheckout.id,
            type: activeCheckout.type,
            startTime: activeCheckout.startTime,
            expectedReturnTime: activeCheckout.expectedReturnTime,
            isOverdue,
            user: activeCheckout.user,
          }
        : null,
      waitlistCount: device.waitlist.length,
    };
  });
};

export const createDeviceByAdmin = async (data: {
  name: string;
  category: string;
  serial_no: string;
  image_url?: string;
  status?: DeviceStatus;
}) => {
  const existing = await prisma.device.findUnique({
    where: { serial_no: data.serial_no },
  });

  if (existing) {
    throw new ConflictError("A device with this serial number already exists");
  }

  const qr_code = crypto.randomUUID();
  let qr_image_url = "";
  try {
    const qrSvg = await generateQrSvg(qr_code);
    qr_image_url = await uploadSvgToCloudinary(qrSvg, `qr-${qr_code}`);
  } catch (err) {
    console.warn("QR upload fallback to data SVG:", err);
    qr_image_url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qr_code}`;
  }

  const device = await prisma.device.create({
    data: {
      name: data.name,
      category: data.category.toUpperCase(),
      serial_no: data.serial_no,
      qr_code,
      image_url: data.image_url || "/demo.jpg",
      qr_image_url,
      status: data.status || "AVAILABLE",
    },
  });

  return device;
};

export const updateDeviceByAdmin = async (
  id: string,
  data: {
    name?: string;
    category?: string;
    serial_no?: string;
    status?: DeviceStatus;
    image_url?: string;
  }
) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) {
    throw new NotFoundError("Device not found");
  }

  if (data.serial_no && data.serial_no !== device.serial_no) {
    const existing = await prisma.device.findUnique({
      where: { serial_no: data.serial_no },
    });
    if (existing) {
      throw new ConflictError("Serial number already in use by another device");
    }
  }

  const updated = await prisma.device.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.category && { category: data.category.toUpperCase() }),
      ...(data.serial_no && { serial_no: data.serial_no }),
      ...(data.status && { status: data.status }),
      ...(data.image_url && { image_url: data.image_url }),
    },
  });

  return updated;
};

export const deleteDeviceByAdmin = async (id: string) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) {
    throw new NotFoundError("Device not found");
  }

  // Check if active checkouts exist
  const activeCheckouts = await prisma.checkout.count({
    where: { deviceId: id, status: "ACTIVE" },
  });

  if (activeCheckouts > 0) {
    throw new BadRequestError("Cannot delete device with active checkout. Mark as returned first.");
  }

  await prisma.waitlist.deleteMany({ where: { deviceId: id } });
  await prisma.checkout.deleteMany({ where: { deviceId: id } });
  return prisma.device.delete({ where: { id } });
};

export const getAllCheckoutsForAdmin = async () => {
  const now = new Date();
  const checkouts = await prisma.checkout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      device: {
        select: { id: true, name: true, category: true, serial_no: true, status: true },
      },
    },
  });

  return checkouts.map((c) => ({
    ...c,
    isOverdue:
      c.status === "ACTIVE" &&
      c.type === "CHECKOUT" &&
      new Date(c.expectedReturnTime) < now,
  }));
};

export const forceReturnCheckout = async (checkoutId: string) => {
  const checkout = await prisma.checkout.findUnique({
    where: { id: checkoutId },
    include: { device: true },
  });

  if (!checkout) {
    throw new NotFoundError("Checkout record not found");
  }

  if (checkout.status !== "ACTIVE") {
    throw new BadRequestError("Checkout is not active");
  }

  const now = new Date();

  // Mark checkout returned
  const updatedCheckout = await prisma.checkout.update({
    where: { id: checkoutId },
    data: {
      status: "RETURNED",
      returnedAt: now,
    },
  });

  // Check if anyone is waiting for this device
  const nextWaiting = await prisma.waitlist.findFirst({
    where: { deviceId: checkout.deviceId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (nextWaiting) {
    await prisma.waitlist.update({
      where: { id: nextWaiting.id },
      data: {
        status: "NOTIFIED",
        notifiedAt: now,
      },
    });

    await prisma.device.update({
      where: { id: checkout.deviceId },
      data: { status: "AVAILABLE" },
    });
  } else {
    await prisma.device.update({
      where: { id: checkout.deviceId },
      data: { status: "AVAILABLE" },
    });
  }

  return updatedCheckout;
};

export const getAllWaitlistsForAdmin = async () => {
  return prisma.waitlist.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      device: {
        select: { id: true, name: true, category: true, serial_no: true, status: true },
      },
    },
  });
};

export const getAllUsersForAdmin = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          checkouts: true,
          waitlist: true,
        },
      },
      checkouts: {
        where: { status: "ACTIVE" },
        include: {
          device: {
            select: { id: true, name: true, category: true, serial_no: true },
          },
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    totalCheckouts: u._count.checkouts,
    waitlistCount: u._count.waitlist,
    activeCheckouts: u.checkouts,
  }));
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
};
