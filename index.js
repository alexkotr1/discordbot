const fs = require("fs");
const path = require("path");

const folderPath = "./commands";

function findJSFiles(directory) {
  let jsFiles = [];

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);

    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      if (path.extname(file) === ".js") {
        jsFiles.push(filePath);
      }
    } else if (stats.isDirectory()) {
      const nestedFiles = findJSFiles(filePath);
      jsFiles = jsFiles.concat(nestedFiles);
    }
  }

  return jsFiles;
}

function requireFunctions(jsFiles) {
  const functions = {};

  for (const file of jsFiles) {
    const fileName = path.basename(file, ".js");
    const modulePath = path.resolve(file);
    try {
      const requiredModule = require(modulePath);

      if (typeof requiredModule === "function" && !isClass(requiredModule)) {
        functions[fileName] = requiredModule;
      }
    } catch (err) {
      console.error(err);
    }
  }

  return functions;
}

const jsFiles = findJSFiles(folderPath);
const functions = requireFunctions(jsFiles);
Object.entries(functions).forEach(([key, value]) => {
  if (typeof value === "function") value();
});

function isClass(obj) {
  const isCtorClass =
    obj.constructor && obj.constructor.toString().substring(0, 5) === "class";

  if (obj.prototype === undefined) {
    return isCtorClass;
  }

  const isPrototypeCtorClass =
    obj.prototype.constructor &&
    obj.prototype.constructor.toString &&
    obj.prototype.constructor.toString().substring(0, 5) === "class";

  return isCtorClass || isPrototypeCtorClass;
}
