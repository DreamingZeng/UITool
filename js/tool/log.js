"use strict";
var log;
(function (log) {
    function i(content) {
        let str = content;
        if (typeof content == "object") {
            str = JSON.stringify(content, null, "\t");
        }
        Editor.log(str);
    }
    log.i = i;
    function e(...args) {
        Editor.error(args);
    }
    log.e = e;
})(log || (log = {}));
module.exports = log;
