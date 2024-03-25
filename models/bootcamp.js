const mongoose = require("mongoose");
const slugify = require("slugify");

const geocoder = require("../utils/geocoder.js");

const bootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    slug: String,
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description can not be more than 500 characters"],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    phone: {
      type: String,
      maxlength: [20, "Phone number can not be longer than 20 characters"],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ],
    },
    averageRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating must can not be more than 10"],
    },
    averageCost: Number,
    photo: {
      type: String,
      default:
        "https://res.cloudinary.com/dvn5j1tnl/image/upload/v1711107774/xzqbru3n3ebso7i1bxix.jpg",
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bootcampSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "bootcamp",
  justOne: false,
});

bootcampSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "bootcamp",
  justOne: false,
});

bootcampSchema.pre("remove", async function (next) {
  console.log(`Courses being removed from bootcamp ${this._id}`);
  await this.model("Course").deleteMany({ bootcamp: this._id });
  next();
});

bootcampSchema.pre("save", function (next) {
  this.slugify = slugify(this.name, { lower: true });
  next();
});

bootcampSchema.pre("save", async function (next) {
  const loc = await geocoder(this.address);

  this.location = {
    type: "Point",
    coordinates: [loc.location.x, loc.location.y],
    formattedAddress: loc.attributes.LongLabel,
    street: loc.attributes.StAddr,
    city: loc.attributes.City,
    state: loc.attributes.StName,
    zipcode: `${loc.attributes.Postal}-${loc.attributes.PostalExt}`,
    country: loc.attributes.Country,
  };
  this.address = undefined;
  next();
});

const bootcamp = mongoose.model("Bootcamp", bootcampSchema);
module.exports = bootcamp;
