const conversionQuery = require("../utils/conversionQuery.js");

const advancedResults = (model, populate) => async (req, res, next) => {
  let query;
  let reqQuery = { ...req.query };
  let matchQuery = ["select", "sort", "page", "limit"];

  matchQuery.forEach((param) => delete reqQuery[param]);

  if (Object.entries(reqQuery).length !== 0) {
    reqQuery = conversionQuery(JSON.stringify(reqQuery));
  }

  query = model.find(reqQuery).lean();

  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const allTotal = await model.countDocuments();
  const total = await model.countDocuments(query);

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query.populate(populate);
  }

  const results = await query;

  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    sucess: true,
    total: allTotal,
    count: results.length,
    pagination,
    data: results,
  });
};

module.exports = advancedResults;
