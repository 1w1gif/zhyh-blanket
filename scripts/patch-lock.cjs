// 给 package-lock.json 补录 fsevents@2.3.3(CI 校验需要,Windows 上 npm 不会写入)
const fs = require("fs");
const path = process.argv[2] || "package-lock.json";
const lock = JSON.parse(fs.readFileSync(path, "utf8"));
lock.packages["node_modules/fsevents"] = {
  version: "2.3.3",
  resolved: "https://registry.npmmirror.com/fsevents/-/fsevents-2.3.3.tgz",
  fileHash:
    "sha512-5xoDifg2PFpuDipLrZWGSGQ+m1CbcCfPbufuNbUZnJoCFmoNFC7PTWOxMpubFmXoV5KBfVNW8LYNqX+mLm+CWA==",
  optional: true,
  os: ["darwin"],
  engines: { node: "^8.16.0 || ^10.6.0 || >=11.0.0" },
};
fs.writeFileSync(path, JSON.stringify(lock, null, 2));
const check = JSON.parse(fs.readFileSync(path, "utf8"));
console.log("fsevents in packages:", Boolean(check.packages["node_modules/fsevents"]));
