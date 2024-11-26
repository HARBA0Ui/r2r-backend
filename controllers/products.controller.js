import prisma from "../db/prisma.js";

import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Gender list
const genders = ["MEN", "WOMEN", "UNISEX"];

export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // await prisma.product.create({
    //   data: {
    //     title: "hoodie test",
    //     desc: "A trendy hoodie perfect for any occasion.",
    //     price: 22.99,
    //     category: "hoodie",
    //     isAvailable: true,
    //     requiredLevel: 1,
    //     imgs: [
    //       "https://i.pinimg.com/736x/fd/c7/70/fdc7704b77bb8d64e2932b386d835790.jpg",
    //     ],
    //   },
    // });

    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params; // Access category from req.params

    // Map human-readable category to Prisma enum
    const categoryMap = {
      "t-shirt": "TSHIRT",
      hoodie: "HOODIE",
      shirt: "SHIRT",
    };

    const prismaCategory = categoryMap[category.toLowerCase()]; // Ensure case-insensitivity

    if (!prismaCategory) {
      return res.status(400).json({ message: "Invalid category!" });
    }

    const products = await prisma.product.findMany({
      where: {
        category: prismaCategory, // Use the mapped enum value
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!products.length) {
      return res.status(404).json({ message: "No products found!" });
    }

    return res.status(200).json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductsByGender = async (req, res) => {
  try {
    const { gender } = req.params; // Access gender from req.params

    // Map human-readable gender to Prisma enum
    const genderMap = {
      women: "WOMEN",
      men: "MEN",
      unisex: "UNISEX",
    };

    const prismaGender = genderMap[gender.toLowerCase()]; // Ensure case-insensitivity

    if (!prismaGender) {
      return res.status(400).json({ message: "Invalid gender!" });
    }

    const products = await prisma.product.findMany({
      where: {
        gender: prismaGender, // Use the mapped enum value
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!products.length) {
      return res.status(404).json({ message: "No products found!" });
    }

    return res.status(200).json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductsByLevel = async (req, res) => {
  try {
    const { level } = req.params; // Access level from req.params
    let parsedLevel = parseInt(level);
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 8;

    // const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      // skip: skip,
      // take: limit,
      where: {
        requiredLevel: parsedLevel, // Filter by category
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!products.length) {
      // Ensure this checks length
      return res.status(404).json({ message: "No products found!" });
    }

    return res.status(200).json({ products });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product)
      return res.status("404").json({ message: "No Products has been found!" });
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: "Couldn't find the product!" });
  }
};

export const getProductByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    // console.log("title: ", title);
    const product = await prisma.product.findMany({
      where: {
        title: {
          contains: title,
          mode: "insensitive",
        },
      },
    });

    if (!product)
      return res.status(404).json({ message: "No product has been found!" });

    return res.status(200).json({ product });
  } catch (err) {
    console.log(err);
  }
};

// Update a product

export const createProduct = async (req, res) => {
  try {
    // Destructure the incoming request body
    const {
      title,
      desc,
      price: reqPrice,
      category,
      isAvailable,
      requiredLevel,
    } = req.body;

    // Parse price and required level to ensure they are numbers
    const price = parseFloat(reqPrice);
    const parsedLevel = parseInt(requiredLevel);
    const isAvailableBoolean = isAvailable === "true"; // Convert isAvailable to boolean

    // Handle file upload if files are provided (assuming cloudinary integration)
    let imgs = [];
    if (req.files.length > 0) {
      const uploadResponse = await cloudinary.uploader.upload(
        req.files[0].path
      );
      imgs.push(uploadResponse.secure_url); // Store the image URL from Cloudinary
    }

    // Generate a random product code
    const randomCode = new ObjectId().toHexString();

    // Create the Code object first
    const newCode = await prisma.code.create({
      data: {
        name: randomCode, // Save the generated random code
        isUsed: false, // Set it as unused initially
      },
    });

    // Create the product object with necessary fields
    await prisma.product.create({
      data: {
        title,
        desc,
        price,
        category,
        gender: "MEN", // Assuming a default gender for now (can be adjusted based on input)
        isAvailable: isAvailableBoolean,
        requiredLevel: parsedLevel,
        imgs,
        codeId: newCode.id, // Associate with the newly created code
      },
    });

    return res
      .status(200)
      .json({ message: "The product has been added successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error creating product" });
  }
};

export const updateProduct = async (req, res) => {
  console.log("Form data:", req.body);
  console.log("Uploaded files:", req.files);
  try {
    const { id } = req.params;

    const {
      title,
      desc,
      price: reqPrice,
      category,
      isAvailable,
      requiredLevel,
    } = req.body;

    const price = parseFloat(reqPrice);
    const parsedLevel = parseInt(requiredLevel);
    const isAvailableBoolean = isAvailable === "true"; // or use Boolean(isAvailable) if it's not a string

    if (req.files.length == 0) {
      await prisma.product.update({
        where: {
          id: id,
        },
        data: {
          title,
          desc,
          price,
          category,
          isAvailable: isAvailableBoolean,
          requiredLevel: parsedLevel,
        },
      });
    } else {
      console.log(req.files);
      const rest = await cloudinary.uploader.upload(req.files[0].path);
      const imgs = [];
      imgs[0] = rest.secure_url;
      const newProduct = {
        title,
        desc,
        price,
        category,
        isAvailable: isAvailableBoolean,
        requiredLevel: parsedLevel,
        imgs,
      };
      await prisma.product.update({
        where: {
          id: id,
        },
        data: newProduct,
      });
    }

    return res
      .status(200)
      .json({ messaage: "The product has been upddated successfully!" });
  } catch (err) {
    console.log(err);
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.imgs.length > 0) {
      const imageUrl = product.imgs[0];

      // Extract the public ID from the image URL
      const segments = imageUrl.split("/");
      const fileNameWithExt = segments.pop();
      const publicId = fileNameWithExt.split(".")[0];

      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Successfully deleted image with public ID: ${publicId}`);
      } catch (err) {
        console.error(`Error deleting image with public ID: ${publicId}`, err);
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany();

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

export const createCategory = async (req, res) => {
  const { title } = req.body;
  try {
    const categories = await prisma.categories.create({
      data: {
        title,
      },
    });

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  // console.log("id: ", id)
  try {
    await prisma.categories.delete({
      where: {
        id,
      },
    });

    return res
      .status(200)
      .json({ message: "Category has been removed successfully" });
  } catch (err) {
    console.log("err: ", err);
  }
};
