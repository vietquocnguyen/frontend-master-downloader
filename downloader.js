const throughParallel = require("through2-parallel");
const fromArray = require("from2-array");
const fs = require("fs");
const https = require("https");
const request = require("request");
let links = [];
let destination = "";

module.exports = downloader;

function downloader(arrLinks, directory) {
  links = arrLinks;
  destination = directory;
  fromArray
    .obj(arrLinks)
    .pipe(
      throughParallel.obj(
        { concurrency: 3 },
        ({ fileName, videoLink }, enc, next) => {
          console.log("Downloading:" + fileName);
          https.get(videoLink, req => {
            arrLinks.shift();
            req.pipe(
              fs
                .createWriteStream(directory + "/" + fileName)
                .on("finish", () => {
                  console.log(fileName + " downloaded");
                  next();
                })
            );
          });
        }
      )
    )
    .on("finish", () => console.log("All video downloaded"));
}

process.on("uncaughtException", function(err) {
  console.log(err);
  downloader(links, destination);
});
