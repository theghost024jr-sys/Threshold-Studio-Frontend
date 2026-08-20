import http from "http";
import fs from "fs";
import path from "path";

const root = path.resolve("website");

http.createServer((req, res) => {
  let filePath = path.join(root, req.url === "/" ? "/index.html" : req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200);
    res.end(data);
  });
}).listen(4176);

console.log("Threshold Studio running at http://localhost:4176");
