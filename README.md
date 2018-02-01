# Frontend-Master-Downloader
Scrape frontendmaster with puppeteer

### Usage

**Requirements**

- Node v7.6.0 or greater
- Google Chrome
- ChromeDriver - WebDriver for Chrome

The latest version of Chrome webdriver can be found at link below and the **Setup** instruction can also be found at the same page,

https://sites.google.com/a/chromium.org/chromedriver/downloads

### Setup Chromedriver (macOS)
```sh
cp chromedriver /usr/local/bin/chromedriver
```

# Try it

Checkout the repo then install it

```
npm install
```
Use the command by doing

```
   node index.js <USERNAME> <PASSWORD> <COURSE_NAME> <COURSE_ID(optional)> <HD(optional)> <DIRECTORY(optional)>
```
Directory is the only argument optionnal, if not provided, the script will create a Download direcory in the current location.

# Example

```
 node index.js  sepiropht mypassword leveldb-crypto

```
