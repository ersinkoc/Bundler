const { bundle } = require("./dist/index.cjs");
const fs = require("fs");

bundle({
  entry: "manual-test/cjs-test/src/index.js",
  outDir: "manual-test/cjs-test/dist",
  format: "cjs",
})
  .then((r) => {
    console.log("--- OUTPUT ---");
    console.log(fs.readFileSync("manual-test/cjs-test/dist/main.js", "utf8"));
  })
  .catch((e) => {
    console.error("ERROR:", e.message);
    console.error(e.stack);
  });
