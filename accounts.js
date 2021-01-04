const { writeFileSync, existsSync, readFileSync } = require("fs");
const words = readFileSync("./words.txt", "utf8").split("\r\n");
const FILE = "./accounts.json";

function saveAccount(account) {
  let accounts = [];
  if (existsSync(FILE)) {
    accounts = JSON.parse(readFileSync(FILE));
  }

  accounts.push(account);
  writeFileSync(FILE, JSON.stringify(accounts));
}

function generateUsername() {
  const username = randomNumbers() + randWord() + randWord() + randomNumbers();
  if (username.length > 20) {
    return username.substr(0, 20);
  } else {
    return username;
  }
}

function generateEmail(uname) {
  return uname + "@aol.com";
}

function generatePassword() {
  return randWord() + randWord() + randWord();
}

function randWord() {
  const LINE_COUNT = words.length;
  const lineNum = Math.floor(Math.random() * LINE_COUNT);
  const word = words[lineNum];
  if (word.length > 7) {
    return word.substr(0, 7);
  } else {
    return word;
  }
}

function randomNumbers() {
  return String(Math.random()).split(".")[1].substr(0, 3);
}

module.exports = {
  saveAccount,
  generateUsername,
  generatePassword,
  generateEmail,
};
