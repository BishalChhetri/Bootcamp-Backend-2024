const jwt = require("jsonwebtoken");

const asyncHandler = require("./async.js");
const ErrorResponse = require("../utils/errorResponse.js");
const User = require("../models/user.js");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorize to access this route.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (e) {
    return next(new ErrorResponse("Not authorize to access this route.", 401));
  }
});

exports.authorize = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user?.role} is not authorized to access this route.`,
          403
        )
      );
    }
    next();
  };
};
