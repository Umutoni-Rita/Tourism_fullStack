const express = require("express");

// Import middlewares
const { protect, filterUser } = require("../middleware/auth");

// Importing controllers
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  signup,
  emailConfirmation,
  saveContactFormQuery,
  getAllContactFormQueries,
  deleteContactFormQuery,
  replyToContactFormQuery,
} = require("../controllers/userControllers"); // <-- Corrected import path

// Initializing router

const router = express.Router();

router.route("/").get(protect, getAllUsers);

router.route("/signup").post(signup);

router.route("/login").post(loginUser);

// Email confirmation route
router.get("/email-confirmation/:token", emailConfirmation); // <-- Updated route handler

// Contact form routes
router.route("/contact-form").post(saveContactFormQuery);
router
  .route("/contact-form")
  .get(protect, filterUser("ADMIN"), getAllContactFormQueries);
router
  .route("/contact-form/:id")
  .delete(protect, filterUser("ADMIN"), deleteContactFormQuery);
router.route("/contact-form/:id").post(replyToContactFormQuery);

router
  .route("/:id")
  .put(protect, updateUser)
  .delete([protect, filterUser("ADMIN")], deleteUser)
  .get(getUserById);

module.exports.userRoutes = router;
