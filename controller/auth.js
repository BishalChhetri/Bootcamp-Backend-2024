const express = require("express");
const crypto = require("crypto");

require("../src/database/db.js");
const asyncHandler = require("../middleware/async.js");
const User = require("../models/user.js");
const ErrorResponse = require("../utils/errorResponse.js");
const { protect } = require("../middleware/auth.js");
const { sendEmail } = require("../utils/sendEmail.js");

const router = express.Router();

const sendTokenResponse = async (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  const users = JSON.parse(JSON.stringify(user));

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ user: { ...users, token } });
};

router.post(
  "/register",
  asyncHandler(async (req, res, next) => {
    const { name, email, password, image, role, googleSignIn } = req.body;
    let user;
    if (googleSignIn && googleSignIn === "True") {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        image,
        isThirdPartySignIn: true,
      });
    } else {
      user = await User.create({ name, email: email.toLowerCase(), password });
    }
    sendTokenResponse(user, 200, res);
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res, next) => {
    const { email, password, image, googleSignIn } = req.body;

    if (googleSignIn) {
      let user = await User.findOne({ email: email.toLowerCase() });
      if (image.length !== 0) {
        user = await User.findOneAndUpdate(
          { email: email.toLowerCase() },
          { $set: { image } },
          { new: true }
        );
      }
      sendTokenResponse(user, 200, res);
      return;
    }

    if (!email || !password) {
      return next(
        new ErrorResponse("Please provide an email and password", 400)
      );
    }

    let user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return next(new ErrorResponse(`Invalid credentials`, 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse(`Invalid credentials`, 401));
    }
    user = await User.findOne({ email: email.toLowerCase() });

    sendTokenResponse(user, 200, res);
  })
);

router.get(
  "/logout",
  asyncHandler(async (req, res, next) => {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ success: true, data: {} });
  })
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.log(error.message);
    }
  })
);

router.put(
  "/updateDetails",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const fieldsToUpdate = {
        email: req.body.email,
        name: req.body.name,
      };

      const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      return new ErrorResponse(e.message, 400);
    }
  })
);

router.put(
  "/updatePassword",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      if (!user) {
        return next(new ErrorResponse("Invalid Credentials!", 401));
      }

      if (!user?.isThirdPartySignIn && !req.body.currentPassword) {
        return next(new ErrorResponse("Password is incorrect", 401));
      }

      if (
        !user?.isThirdPartySignIn &&
        req.body.currentPassword &&
        !(await user.matchPassword(req.body.currentPassword))
      ) {
        return next(new ErrorResponse("Password is incorrect", 401));
      }

      user.password = req.body.newPassword;
      user.isThirdPartySignIn = false;

      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (error) {
      console.log(error.message);
    }
  })
);

router.post(
  "/forgotPassword",
  asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    if (!user) {
      return next(
        new ErrorResponse("There is no user associated with this email", 404)
      );
    }

    const resetToken = await user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    try {
      await sendEmail({
        name: user?.name,
        email: user?.email,
        link: resetUrl,
      });
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (e) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      return next(new ErrorResponse(`Email could not be sent`, 500));
    }
  })
);

router.get(
  "/isValidToken/:resettoken",
  asyncHandler(async (req, res, next) => {
    const resetToken = req.params.resettoken;
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse(`Invalid Token`, 400));
    }

    res.status(200).json({ success: true, isValid: true });
  })
);

router.put(
  "/resetpassword/:resettoken",
  asyncHandler(async (req, res, next) => {
    const resetToken = req.params.resettoken;
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse(`Invalid Token`, 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  })
);

module.exports = router;
