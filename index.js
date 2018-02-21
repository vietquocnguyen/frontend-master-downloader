"use strict";

const fs = require("fs");
const https = require("https");
const mkdirp = require("mkdirp");
const throughParallel = require("through2-parallel");
const puppeteer = require("puppeteer");
const fromArray = require("from2-array");

const user = process.argv[2];
const pass = process.argv[3];
const course = process.argv[4];
const courseid = process.argv[5];
const hd = process.argv[6];
const pathDirectory = process.argv[7] || "DownLoads/";
const url = "https://frontendmasters.com";
const SECONDES = 1000;
const onend = require("end-of-stream");
const streamSet = require("stream-set");
const streams = new streamSet();

if (!course || !user || !pass) {
  process.stderr.write("you must provide course, username and your password");
  return;
}

const directory = pathDirectory + course;

mkdirp(directory, function(err) {
  if (err) console.error(err);
});

(async () => {
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
    course
  };

  let link = await page.evaluate(obj => {
    const anchors = Array.from(document.querySelectorAll(obj.selector));
    return anchors
      .map(anchor => {
        return `${anchor.href}`;
      })
      .filter(text => text.includes(obj.course))
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

  if (courseid) {
    const serchLink = `${url}/courses/${course}/${courseid}/`;

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
      downloadVideo({ fileName, videoLink });
    } catch (err) {
      console.log(err);
    }
  } else {
    finalLinks = await getLinks(newLinks);

    console.log("Will start downloading videos");

    downloadVideos(finalLinks);
  }

  async function getLinks(newLinks) {
    for (const templink of newLinks) {
      console.log("in the loop", templink);
      const { index, link } = templink;
      await page.goto(link);
      const selector = "video";

      await page.waitFor(8 * SECONDES);
      let videoLink;
      try {
        videoLink = await page.evaluate(selector => {
          const video = Array.from(document.querySelectorAll(selector)).pop();
          return video.src;
        }, selector);
      } catch (err) {
        console.log(err);
        console.log("You have reached maximum request limit");
        console.log("Sleeping for 15 minutes");
        videoLink = "retry";
      }
      console.log("video link fetched", videoLink);
      if (videoLink === "retry" || !videoLink.length) {
        await timeout(60 * SECONDES * 15);
        console.log("end waiting, scraping continiues !!!!", templink);
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

  function downloadVideos(arrLinks) {
    fromArray.obj(arrLinks).pipe(
      throughParallel.obj(
        { concurrency: 3 },
        ({ fileName, videoLink }, enc, next) => {
          console.log("Downloading:" + fileName);
          https.get(videoLink, req => {
            const writeVideoFileStream = fs.createWriteStream(
              directory + "/" + fileName
            );
            streams.add(writeVideoFileStream);

            onend(writeVideoFileStream, err => {
              if (err) console.log(err);
              console.log(fileName + " downloaded");
              if (!streams.size) {
                console.log("All videos downloaded");
                process.exit();
              }
            });

            req.pipe(writeVideoFileStream.on("finish", () => next()));
          });
        }
      )
    );
  }

  function downloadVideo({ fileName, videoLink }) {
    if (videoLink) {
      https.get(videoLink, req =>
        req.pipe(
          fs.createWriteStream(directory + "/" + fileName).on("finish", () => {
            console.log(fileName + " downloaded");
          })
        )
      );
    }
  }

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
