const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");

const Logger = require("./Logger.js");
const logger = new Logger();

const solve = require("puppeteer-recaptcha-solver");
const accounts = require("./accounts.js");

const uname = accounts.generateUsername();
const ACCOUNT = {
  username: uname,
  email: accounts.generateEmail(uname),
  password: accounts.generatePassword(),
};

async function run(proxyPort) {
  puppeteer.use(pluginStealth());

  logger.log("STARTING BROWSER...");
  const browser = await puppeteer.launch({
    headless: true,
    // executablePath: "/usr/bin/chromium-browser",
    args: [
      "--window-size=500,700",
      // "--window-position=000,000",
      "--no-sandbox",
      // "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=site-per-process",
      // `--proxy-server=socks5://127.0.0.1:${proxyPort}`,
    ],
  });

  logger.log("NAVIGATION TO https://old.reddit.com/register#content...");
  const page = await browser.newPage();
  try {
    await page.goto("https://old.reddit.com/register#content");
  } catch (err) {
    logger.log("ERROR: FAILED TO NAVIGATE TO URL");
    logger.log(err);
    return;
  }

  logger.log("FILLING OUT REGISTRATION FORM...");
  try {
    await fillForm(page);
  } catch (err) {
    logger.log("ERROR: FAILED WHILE FILLING OUT REGESTRATION FORM");
    logger.log(err);
    return;
  }

  logger.log("ATTEMPTING TO SOLVE CATPCHA...");
  try {
    await solve(page);
    logger.log("CAPTCHA SOLVE SUCCESSFUL");
  } catch {
    logger.log("POTENTIAL SOLVE ERROR");
  }

  logger.log("ATTEMPTING ACCOUNT CREATION...");
  let success = false;
  await page.evaluate(() => {
    const submitBtn = document.querySelector("#register-form button[type='submit']");
    submitBtn.click();
  });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: "./screenshot.jpg", type: "jpeg" });

  const domain = await page.evaluate(() => {
    return window.location.href;
  });
  if (domain === "https://old.reddit.com/") {
    success = true;
  }

  // check for rate limit
  // const ratelimit = await page.evaluate(() => {
  //   const ratelimit = document.querySelector(".field-ratelimit");
  //   if (ratelimit.innerHTML) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // });

  // save account details
  if (success) {
    logger.log("ACCOUNT CREATION SUCCESSFUL. SAVING ACCOUNT DETAILS...");
    accounts.saveAccount({ ...ACCOUNT, success: success });
  }

  // logger.log("RATELIMIT: " + ratelimit);
  logger.log("SUCCESS: " + success);
  logger.log("DONE");
  browser.close();
  process.exit();
}

async function fillForm(page) {
  await page.evaluate((ACCOUNT) => {
    const fields = {
      username: document.getElementById("user_reg"),
      password: document.getElementById("passwd_reg"),
      passwordVerify: document.getElementById("passwd2_reg"),
      email: document.getElementById("email_reg"),
    };

    fields.username.value = ACCOUNT.username;
    fields.password.value = ACCOUNT.password;
    fields.passwordVerify.value = ACCOUNT.password;
    fields.email.value = ACCOUNT.email;
  }, ACCOUNT);

  // make page recognise field input so that captcha shows
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
}

process.on("SIGINT", () => {
  logger.log("bye!");
  process.exit();
});

// for (let proxyPort = 9060; proxyPort <= 9065; proxyPort++) {
//   run(proxyPort);
// }
run();
