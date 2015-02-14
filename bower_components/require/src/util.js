var util = {},
    SPLITER = /[\/]+/;


function isString(obj) {
    return Object.prototype.toString.call(obj) === "[object String]";
}
util.isString = isString;

function dirname(path) {
    path = path.substring(0, path.lastIndexOf("/") + 1);
    return path ? path.substr(0, path.length - 1) : ".";
}
util.dirname = dirname;

function extname(path) {
    var index = path.lastIndexOf(".");
    return index > -1 ? path.substring(index) : "";
}
util.extname = extname;

var normalize_urlRegex = /(^(?:[a-z]+:)?\/\/)(.*)/i;

function normalize(path) {
    var paths = normalize_urlRegex.exec(path),
        isUrl = paths ? !!paths[1] : false,
        isAbs = isUrl || path.charAt(0) === "/",
        trailingSlash = path[path.length - 1] === "/",
        segments = isUrl ? paths[2].split(SPLITER) : path.split(SPLITER),
        nonEmptySegments = [],
        i;

    for (i = 0; i < segments.length; i++) {
        if (segments[i]) nonEmptySegments.push(segments[i]);
    }
    path = normalizeArray(nonEmptySegments, !isAbs).join("/");

    if (!path && !isAbs) path = ".";
    if (path && trailingSlash) path += "/";

    return (isAbs ? (isUrl ? paths[1] : "/") : "") + path;
}
util.normalize = normalize;

function normalizeArray(parts, allowAboveRoot) {
    var i = parts.length,
        up = 0,
        last;

    while (i--) {
        last = parts[i];

        if (last === ".") {
            parts.splice(i, 1);
        } else if (last === "..") {
            parts.splice(i, 1);
            up++;
        } else if (up) {
            parts.splice(i, 1);
            up--;
        }
    }

    if (allowAboveRoot) {
        while (up--) parts.unshift("..");
    }

    return parts;
}
util.normalizeArray = normalizeArray;

function join() {
    var path = "",
        segment,
        i, il;

    for (i = 0, il = arguments.length; i < il; i++) {
        segment = arguments[i];

        if (!isString(segment)) {
            throw new TypeError("Arguments to join must be strings");
        }
        if (segment) {
            if (!path) {
                path += segment;
            } else {
                path += "/" + segment;
            }
        }
    }

    return normalize(path);
}
util.join = join;


var isURL_regex = /^(?:[a-z]+:)?\/\//i;

function isURL(str) {
    return isURL_regex.test(str);
}
util.isURL = isURL;


module.exports = util;
