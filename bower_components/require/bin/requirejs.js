var fs = require("fs"),
    path = require("path"),
    util = require("util");


var hasExtension = /\.[\w]+$/,
    REQUIRE = /require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
    COMMENT = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
    ObjectPrototype = Object.prototype;


function RequireJS(index, verbose) {

    this.verbose = !!verbose;
    this.main = index;

    this.path = path.dirname(index);
    this.index = this.modulize(index);

    this.parsed = {};
    this.modules = [];
    this.paths = {};

    this.parse(this.main, this.index);
}

RequireJS.prototype.parse = function(filename, relativePath) {
    var _this = this,
        content = fs.readFileSync(filename).toString(),
        isJSON = path.extname(filename).toLowerCase() === ".json",
        deps = {};

    _this.parsed[relativePath] = true;

    content.replace(COMMENT, "").replace(REQUIRE, function(match, dep) {
        var resolvedFilePath, resolvedPath;

        if (isModule(dep)) {
            resolvedFilePath = _this.resolveModulePath(dep, path.dirname(filename));
            resolvedPath = dep;
        } else {
            resolvedFilePath = _this.resolveFilePath(dep, path.dirname(filename));
            resolvedPath = _this.modulize(resolvedFilePath);
        }

        deps[dep] = resolvedPath;
        if (_this.parsed[resolvedPath]) return;

        _this.parse(resolvedFilePath, resolvedPath);
    });
    content = content.replace(REQUIRE, function(match, dep) {

        return 'require("' + deps[dep] + '")';
    });

    this.addModule(relativePath, content, isJSON);
};

RequireJS.prototype.addModule = function(relativePath, content, isJSON) {
    var paths = this.paths,
        modules = this.modules;

    if (paths[relativePath] != undefined) return;
    if (this.verbose) console.log("RequireJS: found dependency " + relativePath);

    content = [
        'function(require, exports, __filename, __dirname, module, process, Buffer, global) {',
        '"use strict";',
        '',
        isJSON ? "module.exports = " + content : content,
        '',
        '}'
    ].join("\n");

    modules.push({
        filename: relativePath,
        dirname: path.dirname(relativePath),
        content: content
    });
    paths[relativePath] = modules.length - 1;
};

RequireJS.prototype.modulize = function(pathname) {
    pathname = path.relative(this.path, pathname);
    if (!(pathname[0] === "." || pathname[0] === "/")) pathname = "./" + pathname;
    return pathname;
};

RequireJS.prototype.resolveFilePath = function(pathname, frompath) {
    pathname = path.join(frompath, pathname);
    var stat, pkg, tmp;

    try {
        stat = fs.statSync(path.join(process.cwd(), pathname))
    } catch (e) {}

    if (stat && stat.isDirectory()) {
        tmp = path.join(pathname, "index.js");
        if (fs.existsSync(path.join(process.cwd(), tmp))) return tmp;

        tmp = path.join(pathname, "package.json");
        if (fs.existsSync(path.join(process.cwd(), tmp))) {
            pkg = JSON.parse(fs.readFileSync(tmp).toString());
            pathname = path.join(path.dirname(tmp), pkg.main);
        }
    } else {
        if (!hasExtension.test(pathname)) pathname += ".js";
    }
    if (!fs.existsSync(path.join(process.cwd(), pathname))) throw new Error("No Module found with path " + pathname);

    return pathname;
};

RequireJS.prototype.resolveModulePath = function(modulename, frompath) {
    var id = "./node_modules/" + modulename + "/package.json",
        packageJson = path.join(frompath, id),
        found = false,
        resolved,
        pkg;

    if (!fs.existsSync(packageJson)) {
        while (!found) {
            frompath = path.join(frompath, "../");
            packageJson = path.join(frompath, id);
            if (fs.existsSync(packageJson)) found = true;
        }
    } else {
        found = true;
    }

    if (found) {
        pkg = JSON.parse(fs.readFileSync(packageJson).toString());
        resolved = path.join(path.dirname(packageJson), pkg.main);
    }

    return resolved;
};

RequireJS.prototype.modulesToString = function() {

    return '[\n' +
        this.modules.map(function(obj) {
            var out = '[\n';

            out += obj.content + ',\n';
            out += '"' + obj.filename + '", ';
            out += '"' + obj.dirname + '"';

            out += ']';
            return out;
        }).join(',\n') +
        ']';
};

RequireJS.prototype.pathsToString = function() {

    return objectToString(this.paths);
};

RequireJS.prototype.compile = function() {
    var temp = fs.readFileSync(path.join(__dirname, "./templates/template.js")).toString();

    return template(temp, {
        index: '"' + this.index + '"',
        modules: this.modulesToString(),
        paths: this.pathsToString(),
        Buffer: fs.readFileSync(path.join(__dirname, "./templates/buffer.js")).toString(),
        process: fs.readFileSync(path.join(__dirname, "./templates/process.js")).toString(),
        date: (new Date()).toString()
    });
};

function objectToString(obj) {

    return isEmpty(obj) ? '{}' : '{' + Object.keys(obj).map(function(key) {
        return '"' + key + '": ' + obj[key];
    }) + '}';
}

function isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj) || isString(obj)) return obj.length === 0;
    for (var key in obj) {
        if (has(obj, key)) return false;
    }
    return true;
}

function has(obj, key) {

    return ObjectPrototype.hasOwnProperty.call(obj, key);
}

function isString(obj) {

    return ObjectPrototype.toString.call(obj) === "[object String]";
}

function template(text, data) {
    var render,
        escapes = {
            "'": "'",
            "\\": "\\",
            "\r": "r",
            "\n": "n",
            "\t": "t",
            "\u2028": "u2028",
            "\u2029": "u2029"
        },
        escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g,

        start = "<%",
        end = "%>",
        match = "([\\s\\S]+?)",

        evaluate = start + match + end,
        interpolate = start + "=" + match + end,
        escape = start + "-" + match + end,

        index = 0,
        source = "__p+='";

    text.replace(new RegExp(escape + "|" + interpolate + "|" + evaluate + "|$", "g"), function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, function(match) {
            return '\\' + escapes[match];
        });

        if (escape) source += "'+\n((__t=(" + escape + "))==null?'':escape(__t))+\n'";
        if (interpolate) source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        if (evaluate) source += "';\n" + evaluate + "\n__p+='";

        index = offset + match.length;

        return match;
    });
    source += "';\n";

    source = 'with(obj||{}){\n' + source + '}\n';
    source = "var __t,__p='',__j=Array.prototype.join, print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";

    try {
        render = new Function('obj', source);
    } catch (e) {
        e.source = source;
        throw e;
    }

    if (data) return render(data);

    function temp(data) {
        return render.call(this, data);
    };
    temp.source = 'function(obj){\n' + source + '}';

    return temp;
}

function isModule(pathname) {
    return !!(pathname[0] !== "." && pathname[0] !== "/");
}

module.exports = RequireJS;
