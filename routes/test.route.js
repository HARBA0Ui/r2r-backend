import { shouldBeLoggedIn } from "../controllers/test.controller.js";

import express from "express";
import verifyToken from "../middlware/verifyToken.js";

const router = express.Router();

router.get("/should-be-loggedIn", verifyToken, shouldBeLoggedIn);

export default router;