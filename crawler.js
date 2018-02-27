const puppeteer = require("puppeteer");

const url = "https://frontendmasters.com";
const SECONDES = 1000;

module.exports = async ({ user, pass, courses, id }) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
  );
  await page.goto(url + "/login");

  await page.waitFor(2 * SECONDES);

  await page.waitForSelector("#username");
  const username = await page.$("#username");
  await username.type(user);
  const password = await page.$("#password");
  await password.type(pass);
  const button = await page.$("button");
  await button.click();
  let selector = ".title a";
  await page.waitForSelector(selector);
  const obj = {
    selector,
    courses
  };

  let link = await page.evaluate(obj => {
    const anchors = Array.from(document.querySelectorAll(obj.selector));
    return anchors
      .map(anchor => {
        return `${anchor.href}`;
      })
      .filter(text => text.includes(obj.courses))
      .pop();
  }, obj);
  await page.goto(link);
  selector = ".LessonListItem a";
  await page.waitForSelector(selector);
  const links = await page.evaluate(selector => {
    const anchors = Array.from(document.querySelectorAll(selector));
    return anchors.map(anchor => {
      return `${anchor.href}`;
    });
  }, selector);
  let finalLinks = [];
  const newLinks = links.map((link, index) => {
    return {
      index,
      link
    };
  });

  if (id) {
    const serchLink = `${url}/courses/${courses}/${id}/`;

    const useLink = newLink.filter(item => item.link === serchLink)[0];
    const index = useLink.index;
    const link = useLink.link;
    await page.goto(link);
    selector = "video";

    await page.waitFor(8 * SECONDES);
    const videoLink = await page.evaluate(selector => {
      const video = Array.from(document.querySelectorAll(selector)).pop();
      return video.src;
    }, selector);

    const fileName =
      `${index + 1}-` +
      link
        .split("/")
        .filter(str => str.length)
        .pop() +
      ".mp4";
    try {
      return [{ fileName, videoLink }];
    } catch (err) {
      console.log("ERROR", err);
    }
  } else {
    finalLinks = await getLinks(newLinks);

    console.log("Will start downloading videos");

    return finalLinks;
  }

  async function getLinks(newLinks) {
    for (const templink of newLinks) {
      console.log("in the loop", templink);
      const { index, link } = templink;
      try {
        await page.goto(link);
      } catch (err) {
        //console.log("erreur, err");
      }
      const selector = "video";

      await page.waitFor(8 * SECONDES);
      let videoLink = await page
        .evaluate(selector => {
          const video = Array.from(document.querySelectorAll(selector)).pop();
          return video.src;
        }, selector)
        .catch(err => {
          //console.log(err);
          return "retry";
        });
      console.log("video link fetched", videoLink);

      if (videoLink === "retry" || !videoLink.length) {
        console.log("You have reached maximum request limit");
        console.log("Sleeping for 15 minutes");
        await timeout(60 * SECONDES * 15);
        console.log("end waiting scraping continiues !!!!", templink);
        const { index, link } = templink;
        await page.goto(link);
        const selector = "video";

        await page.waitFor(8 * SECONDES);
        videoLink = await page.evaluate(selector => {
          const video = Array.from(document.querySelectorAll(selector)).pop();
          return video.src;
        }, selector);
      }

      const fileName =
        `${index + 1}-` +
        link
          .split("/")
          .filter(str => str.length)
          .pop() +
        ".mp4";
      finalLinks.push({ fileName, videoLink });
    }
    return finalLinks;
  }
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
