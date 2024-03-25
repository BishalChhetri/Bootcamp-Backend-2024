const express = require("express");

require("../src/database/db.js");
const Review = require("../models/review.js");
const Bootcamp = require("../models/bootcamp.js");
const ErrorResponse = require("../utils/errorResponse.js");
const asyncHandler = require("../middleware/async.js");
const advancedResults = require("../middleware/advancedResults.js");
const { protect, authorize } = require("../middleware/auth.js");

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  advancedResults(Review, { path: "bootcamp", select: "name description" }),
  asyncHandler(async (req, res, next) => {
    if (req.params.bootcampId) {
      const reviews = await Review.find({ bootcamp: req.params.bootcampId });
      return res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
      });
    } else {
      res.status(200).json(res.advancedResults);
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description",
    });

    if (!review) {
      return next(
        new ErrorResponse(
          `No review found with the id of ${req.params.id}`,
          404
        )
      );
    }
    res.status(200).json({
      success: true,
      data: review,
    });
  })
);

router.get(
  "/bootcamp/:id",
  asyncHandler(async (req, res, next) => {
    const review = await Review.find({ bootcamp: req.params.id }).populate({
      path: "user",
      select: "name image",
    });

    res.status(200).json({
      success: true,
      data: review,
    });
  })
);

router.post(
  "/:bootcampId",
  protect,
  authorize("user", "admin"),
  asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp found of id ${req.params.bootcampId}`,
          404
        )
      );
    }
    const review = await Review.create(req.body);

    res.status(200).json({
      success: true,
      data: review,
    });
  })
);

router.put(
  "/:id",
  protect,
  authorize("user", "admin"),
  asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(
        new ErrorResponse(
          `No review with the id of ${req.params.bootcampId}`,
          404
        )
      );
    }

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`Not authorized to update review.`, 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: review,
    });
  })
);

router.delete(
  "/:id",
  protect,
  authorize("user", "admin"),
  asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(
        new ErrorResponse(
          `No review with the id of ${req.params.bootcampId}`,
          404
        )
      );
    }

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`Not authorized to delete review.`, 401));
    }

    await review.deleteOne({ id: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
    });
  })
);

module.exports = router;
