const express = require("express");

require("../src/database/db.js");
const ErrorResponse = require("../utils/errorResponse.js");
const asyncHandler = require("../middleware/async.js");
const { protect, authorize } = require("../middleware/auth.js");
const User = require("../models/user.js");
const advancedResults = require("../middleware/advancedResults.js");

const router = express.Router();

router.get(
  "/user/:email",
  asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      // next(new ErrorResponse(`Invalid Credentials`, 401));
      return res.status(200).json({
        isEmail: "False",
        message: "This email is not registered yet!",
      });
    }

    res.status(200).json({ success: true, user });
  })
);

router.use(protect);
router.use(authorize("admin"));

router.get(
  "/",
  advancedResults(User),
  asyncHandler(async (req, res, next) => {
    // const users = await User.find({});
    res.status(200).json(res.advancedResults());
  })
);

router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.create(req.body);
      res.status(200).json({ success: true, user });
    } catch (e) {
      return next(new ErrorResponse(e.message, 400));
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`Invalid Credentials`, 401));
    }

    res.status(200).json({ success: true, user });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new ErrorResponse(`Invalid Credentials`, 401));
    }

    res.status(200).json({ success: true, user });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, user: {} });
    } catch (error) {
      console.log(error.message);
    }
  })
);

module.exports = router;
