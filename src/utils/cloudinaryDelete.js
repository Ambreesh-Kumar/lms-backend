import cloudinary from "../config/cloudinary.js";

const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default deleteFromCloudinary;
