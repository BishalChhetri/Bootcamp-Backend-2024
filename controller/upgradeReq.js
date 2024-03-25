const express = require("express");

require("../src/database/db.js");
const ErrorResponse = require("../utils/errorResponse.js");
const asyncHandler = require("../middleware/async.js");
const { protect, authorize } = require("../middleware/auth.js");
const UpgradeReq = require("../models/upgradeReq.js");
const advancedResults = require("../middleware/advancedResults.js");
const User = require("../models/user.js");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(advancedResults(UpgradeReq, "users"), async (req, res, next) => {
    res.json(res.advancedResults());
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.params.id;
      const user = await UpgradeReq.find({ user: userId });
      res.status(200).json({
        success: true,
        user: user,
      });
    } catch (e) {
      return next(e);
    }
  })
);

router.get(
  "/accept/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res, next) => {
    try {
      const reqId = req.params.id;
      const upgradeUser = await UpgradeReq.find({ _id: reqId });
      if (upgradeUser && upgradeUser?.length === 0) {
        return next(
          new ErrorResponse(
            `No upgrade request found with the id of ${req.params.id}`,
            404
          )
        );
      }
      const user = await User.findByIdAndUpdate(
        { _id: upgradeUser[0].user },
        { role: "publisher" },
        { new: true }
      );

      await UpgradeReq.deleteOne({ _id: reqId });

      res.status(200).json({
        success: true,
        user: user,
      });
    } catch (e) {
      console.log(e);
      return next(e);
    }
  })
);

router.get(
  "/reject/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res, next) => {
    try {
      const reqId = req.params.id;
      const user = await UpgradeReq.find({ _id: reqId });
      if (user && user?.length === 0) {
        return next(
          new ErrorResponse(
            `No upgrade request found with the id of ${req.params.id}`,
            404
          )
        );
      }

      await UpgradeReq.deleteOne({ _id: reqId });

      res.status(200).json({
        success: true,
        message: "Sucessfully deleted the user upgrade request.",
      });
    } catch (e) {
      return next(e);
    }
  })
);

router.post(
  "/",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.body.user;
      await UpgradeReq.create({ user: userId });

      res.status(200).json({
        success: true,
        message: "Request submitted to upgrade.",
      });
    } catch (e) {
      return next(e);
    }
  })
);

module.exports = router;
