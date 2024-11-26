import bcryptjs from "bcryptjs";
import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await prisma.client.findUnique({
      where: { email },
    });

    if (!client) {
      return res.status(404).json({ message: "User not found!" });
    }

    const passwordMatched = await bcryptjs.compare(password, client.password);

    if (!passwordMatched) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Generate a JWT and send it as a cookie
    const tokenAge = 1000 * 60 * 60 * 24 * 7; // 7 days
    const { password: clientPassword, ...clientInfo } = client;

    const token = jwt.sign(
      {
        id: client.id,
        isAdmin: client.isAdmin, // Include isAdmin in the token for role-based access
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: tokenAge }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: tokenAge,
      })
      .status(200)
      .json({
        ...clientInfo, // Return user info
        isAdmin: client.isAdmin, // Explicitly include isAdmin in the response
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to login" });
  }
};


export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successfull" });
};

export const register = async (req, res) => {
  const { email, password, firstName, lastName, isAdmin = false } = req.body;
  console.log("req body: ", req.body)

  try {
    // Check if the email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create the new user
    await prisma.client.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin,
        currentLevel: 1,
        score: 0
      },
    });

    return res.status(200).json({ message: "Your account has been created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to register user" });
  }
};


// export const login = async (req, res) => {
//   const { username, password } = req.body;
//   // console.log(username, password);
//   try {
//     const admin = await prisma.admin.findUnique({
//       where: { username },
//     });

//     if (!admin) return res.status(404).json({ message: "Admin not found!" });

//     // console.log(admin);

//     const passwordMatched = await bcryptjs.compare(password, admin.password);

//     if (!passwordMatched) {
//       return res.status(401).json({ message: "Invalid Credentials!" });
//     }

//     // generate cookie and send it to the user

//     let age = 1000 * 60 * 60 * 24 * 7;
//     // console.log(age);

//     const { password: adminPassword, ...adminInfo } = admin;

//     const token = jwt.sign(
//       {
//         id: admin.id,
//       },
//       process.env.JWT_SECRET_KEY,
//       { expiresIn: age }
//     );

//     res
//       .cookie("token", token, {
//         httpOnly: true,
//         maxAge: age,
//       })
//       .status(200)
//       .json(adminInfo);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to login" });
//   }
// };
