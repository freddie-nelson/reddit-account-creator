const { readFileSync, writeFileSync } = require("fs");

LOG_FILE = "./logs.txt";

class Logger {
  constructor() {
    writeFileSync(LOG_FILE, "");
  }

  log(message) {
    console.log(message);
    let logs = readFileSync(LOG_FILE, "utf-8");
    logs += message + "\n";
    writeFileSync(LOG_FILE, logs);
  }
}

module.exports = Logger;
