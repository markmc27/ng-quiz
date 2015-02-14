#!/usr/bin/env node


var fs = require("fs"),
    path = require("path"),
    hasExtension = /\.[\w]+$/,

    RequireJS = require("./requirejs");


var argv = process.argv.slice(2),

    inName = argv[0],
    outName,

    requirejs = new RequireJS(inName);

if (argv[1] === "-o" && argv[2] != null) {
    outName = argv[2];
    if (!hasExtension.test(outName)) outName += ".js";
} else {
    outName = path.join(path.dirname(inName), path.basename(inName, path.extname(inName))) + ".min.js";
}

fs.writeFileSync(outName, requirejs.compile());
