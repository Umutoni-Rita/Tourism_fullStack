const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const { SMTPServer } = require("smtp-server");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "./config/.env" });
const app = express();
const dbConnection = require("./config/db_connection");

// Requiring user routes
const { userRoutes } = require("./routes/userRoutes");

// Swagger conf
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger");

// Running db connection function
dbConnection();

// Used middlewares
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

// API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/user", userRoutes);

app.use(
  session({
    secret: process.env.JWT_SECRET,
    // Replace with a secret key for session encryption

    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());

app.get("/", (req, res) => res.send("Here's the backend"));

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});
