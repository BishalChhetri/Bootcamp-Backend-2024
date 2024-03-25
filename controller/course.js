const express = require("express");

require("../src/database/db.js");
const ErrorResponse = require("../utils/errorResponse.js");
const Course = require("../models/course.js");
const asyncHandler = require("../middleware/async.js");
const advancedResults = require("../middleware/advancedResults.js");
const { protect, authorize } = require("../middleware/auth.js");
const Bootcamp = require("../models/bootcamp.js");

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  advancedResults(Course, { path: "bootcamp", select: "name description" }),
  asyncHandler(async (req, res, next) => {
    if (req.params.bootcampId) {
      const courses = await Course.find({ bootcamp: req.params.bootcampId });
      res
        .status(200)
        .json({ success: true, count: courses.length, data: courses });
    } else {
      res.status(200).json(res.advancedResults());
    }
  })
);

router.get(
  "/bootcamp/:id",
  asyncHandler(async (req, res, next) => {
    try {
      const course = await Course.find({ bootcamp: req.params.id }).populate({
        path: "bootcamp",
        select: "name description",
      });

      if (!course) {
        return next(
          new ErrorResponse(
            `No course found with bootcamp id ${req.params.id}`,
            404
          )
        );
      }
      res.status(200).json({ success: true, courses: course });
    } catch (e) {
      console.log(e);
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    try {
      const course = await Course.findById(req.params.id)
        .populate({
          path: "bootcamp",
          select: "name description location",
        })
        .populate({ path: "user", select: "name image" });

      if (!course) {
        return next(
          new ErrorResponse(`No course found with id ${req.params.id}`, 404)
        );
      }
      res.status(200).json({ success: true, course: course });
    } catch (e) {
      console.log(e);
    }
  })
);

router.post(
  "/",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;
    const bootcamp = await Bootcamp.find({ user: req.user.id });
    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp found with id ${req.params.bootcampId}`,
          404
        )
      );
    }
    // Make Sure owner of the course is current user
    if (
      bootcamp[0].user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `The user ${req.user.id} is not authorised to add course in this bootcamp`,
          401
        )
      );
    }

    req.body.bootcamp = bootcamp[0]._id;

    try {
      const course = await Course.create(req.body);

      res.status(200).json({ success: true, course: course });
    } catch (e) {
      console.log(e.message);
    }
  })
);

router.post(
  "/:bootcampId",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;
    const bootcamp = await Bootcamp.find({ user: req.user.id });

    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp found with id ${req.params.bootcampId}`,
          404
        )
      );
    }
    // Make Sure owner of the course is current user
    if (bootcamp.user !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `The user ${req.user.id} is not authorised to add course in this bootcamp`,
          401
        )
      );
    }

    try {
      const course = await Course.create(req.body);

      res.status(200).json({ success: true, course: course });
    } catch (e) {
      console.log(e.message);
    }
  })
);

router.put(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    try {
      let course = await Course.findById(req.params.id);

      if (!course) {
        return next(
          new ErrorResponse(`No course found with id of ${req.params.id}`)
        );
      }

      if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
          new ErrorResponse(
            `The user ${req.user.id} is not authorised to update this course`,
            401
          )
        );
      }

      course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate({ path: "bootcamp", select: "name description" });

      res.status(200).json({ success: true, course: course });
    } catch (e) {
      console.log(e);
    }
  })
);

router.delete(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    try {
      let course = await Course.findById(req.params.id);

      if (!course) {
        return next(
          new ErrorResponse(`No course found with id of ${req.params.id}`)
        );
      }

      if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
          new ErrorResponse(
            `The user ${req.user.id} is not authorised to update this course`,
            401
          )
        );
      }

      await course.deleteOne({ id: req.params.id });

      res.status(200).json({ success: true, data: {} });
    } catch (e) {
      console.log(e);
    }
  })
);

module.exports = router;
