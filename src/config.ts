import fs from 'fs';
const version = JSON.parse(fs.readFileSync('package.json').toString()).version;

export default {
  botPrefix: "/",
  version,
  websiteUrl: "https://www.informatik.uni-leipzig.de/ifijung/10/service/stundenplaene/$0/inf-med.html",
};