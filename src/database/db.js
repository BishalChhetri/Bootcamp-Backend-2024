const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("Mongodb database connected."))
  .catch((error) =>
    console.log(`Error! Database not connected. ${error.message}`)
  );
