const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const fileUpload = require("express-fileupload");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

const authentication = require("./controller/auth.js");
const usersRoute = require("./controller/user.js");
const bootcampsRoute = require("./controller/bootcamp.js");
const coursesRoute = require("./controller/course.js");
const reviewsRoute = require("./controller/review.js");
const upgradeReqRoute = require("./controller/upgradeReq.js");
const errorHandler = require("./middleware/error.js");

const app = express();

app.use(cors());

app.use(express.json());

app.use(cookieParser());

app.use(mongoSanitize());

// app.use(rateLimiter({ windowMs: 10 * 60 * 1000, max: 100 }));

app.use(helmet());

app.use(xss());

app.use(hpp());

app.use(fileUpload());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/auth", authentication);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/bootcamps", bootcampsRoute);
app.use("/api/v1/courses", coursesRoute);
app.use("/api/v1/reviews", reviewsRoute);
app.use("/api/v1/upgradeRequest", upgradeReqRoute);

app.use(errorHandler);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
