const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please a title for the review"],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Please add a rating between 1 and 5"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

reviewSchema.statics.getAverageRating = async function (bootcampId) {
  let obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (obj.length === 0) {
    obj = [{ _id: bootcampId, averageRating: 0 }];
  }

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating,
    });
  } catch (e) {
    console.log(e);
  }
};

reviewSchema.post("save", async function () {
  this.constructor.getAverageRating(this.bootcamp);
});

reviewSchema.post("remove", async function () {
  this.constructor.getAverageRating(this.bootcamp);
});

const review = mongoose.model("Review", reviewSchema);
module.exports = review;
