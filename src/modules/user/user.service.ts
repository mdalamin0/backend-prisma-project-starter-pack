import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      image: true,
      imagePublicId: true,
    },
  });

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
        },
        async (error, result) => {
          if (error) {
            return reject(error);
          }
        if (!result) {
          return reject(
            new AppError(
              httpStatus.INTERNAL_SERVER_ERROR,
              "Failed to upload image.",
            ),
          );
        }
          resolve(result);
        },
      ).end(buffer);
    },
  );

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      image: cloudinaryResult.secure_url,
      imagePublicId: cloudinaryResult.public_id,
    },
    omit: {
      password: true,
    },
  });

 if (currentUser.imagePublicId && currentUser.image) {
   try {
     await cloudinary.uploader.destroy(currentUser.imagePublicId);
   } catch (error) {
     console.error("Failed to delete old profile image:", error);
   }
 }

  return updatedUser;
};

export const userServices = {
  uploadProfileImage,
};
