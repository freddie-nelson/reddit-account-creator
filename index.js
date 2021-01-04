const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");

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

  console.log("STARTING BROWSER...");
  const browser = await puppeteer.launch({
    headless: true,
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

  console.log("NAVIGATION TO https://old.reddit.com/register#content...");
  const page = await browser.newPage();
  await page.goto("https://old.reddit.com/register#content");

  console.log("FILLING OUT REGISTRATION FORM...");
  await fillForm(page);

  console.log("ATTEMPTING TO SOLVE CATPCHA...");
  try {
    await solve(page);
    console.log("CAPTCHA SOLVE SUCCESSFUL");
  } catch {
    console.log("POTENTIAL SOLVE ERROR");
  }

  console.log("ATTEMPTING ACCOUNT CREATION...");
  let success = true;
  try {
    await Promise.all([
      page.waitForNavigation(),
      page.evaluate(() => {
        const submitBtn = document.querySelector("#register-form button[type='submit']");
        submitBtn.click();
      }),
    ]);
  } catch {
    success = false;
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
    console.log("ACCOUNT CREATION SUCCESSFUL. SAVING ACCOUNT DETAILS...");
    accounts.saveAccount({ ...ACCOUNT, success: success });
  }

  // console.log("RATELIMIT: " + ratelimit);
  console.log("SUCCESS: " + success);
  console.log("DONE");
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
  console.log("bye!");
  process.exit();
});

// for (let proxyPort = 9060; proxyPort <= 9065; proxyPort++) {
//   run(proxyPort);
// }
run();
