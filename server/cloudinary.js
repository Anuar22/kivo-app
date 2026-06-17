const cloudinary = require("cloudinary").v2;

const configured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Uploads an in-memory buffer (from multer) to Cloudinary, returning the secure URL.
// `folder` keeps menu photos and vendor covers organized separately in the dashboard.
function uploadBuffer(buffer, folder = "kivo/menu-items") {
  if (!configured) {
    return Promise.reject(new Error("Image uploads are not configured on this server."));
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto:good" }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadBuffer, configured };
