const fs = require("fs");

const files = fs.readdirSync("./songs");
console.log(files);