require("dotenv").config();
const express = require("express");
const cors = require("cors");
const triggerRouter = require("./routes/trigger");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/trigger", triggerRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
