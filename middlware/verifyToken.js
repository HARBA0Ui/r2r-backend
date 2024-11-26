import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
  
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "You are unauthenticated!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token is not valid!" });
    }

    try {
      // Retrieve user info from the database
      const user = await prisma.client.findUnique({
        where: { id: payload.id },
        select: { id: true, firstName: true, lastName: true, email: true, isAdmin: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found!" });
      }

      req.user = user; // Attach full user info to the request object
      next();
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
};

export default verifyToken;