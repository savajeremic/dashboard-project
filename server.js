const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const organizationRouter = require('./routes/organization');

app.listen(port, () => console.log(`Server is running on port ${port}`));
app.use('/org', organizationRouter);