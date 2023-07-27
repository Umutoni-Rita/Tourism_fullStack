const nodemailer = require("nodemailer");
const usersSchema = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");

// Array to store contact form queries (for demonstration purposes)

const contactFormQueries = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "profile-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,

  auth: {
    user: "backTest43@hotmail.com",
    pass: "slain1234",
  },
});
transporter.verify((err, success) => {
  if (err) {
    console.log("Error verifying email configuration:", err);
  } else {
    console.log("Email configuration is ready to send messages");
  }
});


exports.signup = async (req, res) => {
  try {
    const { name, email, password, type, country, phoneNumber } = req.body;

    if (!(name && email && password)) {
      return res.status(400).send("All fields are compulsory");
    }

    const existingUser = await usersSchema.findOne({ email });
    if (existingUser) {
      return res.status(401).send("User already exists with this email");
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle the picture upload
    upload.single("profilePicture")(req, res, async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading the picture");
      }

      const profilePictureUrl = req.file ? `/uploads/${req.file.filename}` : "";
      const profilePicture = req.file ? "/uploads/" + req.file.filename : null;

      // Create and save the user to the database with the correct hashedPassword field
      const user = await usersSchema.create({
        name,
        email,
        hashedPassword: hashedPassword, // Save the hashed password with the correct field name
        profilePicture: profilePictureUrl,
      });

      const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      user.token = token;
      await user.save();
      await this.sendConfirmationEmail(user);

      return res.status(201).json({
        message: "Signup successful. Please check your email for confirmation.",
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await usersSchema.find();
    if (users.length === 0) {
      return res.send("No users found");
    }
    return res.status(200).json({
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getUserById = async (req, res) => {
  try {
    console.log(req.params.id);
    const users = await usersSchema.findById(req.params.id);
    return res.status(200).json({
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(401).send("You can't update other user");
    }

    const user = await usersSchema.findByIdAndUpdate(req.params.id, {
      fname: req.body.fname,
    });

    if (!user) {
      return res.status(400).send("Unable to update user");
    }

    return res.status(200).send("User updated");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    console.log(req.params.id);
    const user = await usersSchema.findByIdAndDelete(req.params.id);
    return res.status(200).send("User deleted");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Received email:", email);
    console.log("Received password:", password);

    const user = await usersSchema.findOne({ email });

    if (!user) {
      return res.status(404).send("Incorrect email or password");
    }

    console.log("User found:", user);

    // Check if the user object contains a hashedPassword field
    console.log("User hashedPassword:", user.hashedPassword);

    if (!user.hashedPassword) {
      return res.status(404).send("User hashed password not found");
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordMatch) {
      return res.status(404).send("Incorrect email or password");
    }

    // Generate a JWT token with user details (excluding hashedPassword) and send it in the response
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        type: user.type,
      },
      process.env.JWT_SECRET // Replace with your secret key or process.env.jwtsecret
    );

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.emailConfirmation = async (req, res) => {
  try {
    const { token } = req.params;

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const { id } = decodedToken;

    const user = await usersSchema.findByIdAndUpdate(id, {
      isConfirmed: true,
    });

    if (!user) {
      return;
      res.status(404).send("User not found");
    }

    res.status(200).send("Email confirmed successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.sendConfirmationEmail = async (user) => {
  const mailOptions = {
    from: "backTest43@hotmail.com",
    to: user.email,
    subject: "Account Confirmation",
    html: `<p>Please click the link below to confirm your email:</p><a href="http://localhost:${process.env.PORT}/email-confirmation/${user.token}">${user.token}</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);

    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.log("Error sending confirmation email:", error);
  }
};


exports.saveContactFormQuery = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!(name && email && message)) {
      return res.status(400).send("All fields are compulsory");
    }

    // Save the contact form query to the array (for demonstration purposes)
    const query = { name, email, message, timestamp: Date.now() };
    contactFormQueries.push(query);

    // You can also save the query to a database if needed

    // Send an email notification to backTest43@hotmail.com
    const mailOptions = {
      from: "backTest43@hotmail.com", // Replace with your email address
      to: email,
      subject: "New Contact Form Query",
      text: `A new contact form query has been submitted:\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).send("Query submitted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



exports.getAllContactFormQueries = async (req, res) => {
  try {
    // Return all contact form queries (for demonstration purposes)

    res.status(200).json({
      count: contactFormQueries.length,
      data: contactFormQueries,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteContactFormQuery = async (req, res) => {
  try {
    const { id } = req.params;
    // Find and remove the query from the array (for demonstration purposes)

    const index = contactFormQueries.findIndex((query) => query.id === id);

    if (index !== -1) {
      contactFormQueries.splice(index, 1);
    }

    // You can also delete the query from a database if needed

    res.status(200).send("Query deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.replyToContactFormQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply) {
      return;
      res.status(400).send("Reply message is required");
    }

    // Find the query by ID and add the reply (for demonstration purposes)

    const query = contactFormQueries.find((query) => query.id === id);

    if (query) {
      query.reply = reply;
    }

    // You can also update the query in a database if needed

    res.status(200).send("Reply sent successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
