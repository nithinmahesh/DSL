"use strict";
var EngExp = (function () {
    function EngExp() {
        this.prefixes = "";
        this.suffixes = "";
        this.flags = "m";
        this.pattern = "";
        this.openCaptures = 0;
    }
    EngExp.sanitize = function (s) {
        if (s instanceof EngExp)
            return s;
        else
            return s.replace(/([\].|*?+(){}^$\\:=[])/g, "\\$&");
    };
    EngExp.prototype.asRegExp = function () {
        if (this.openCaptures > 0)
            this.suffixes += ")".repeat(this.openCaptures);
        return new RegExp(this.prefixes + this.pattern + this.suffixes, this.flags);
    };
    EngExp.prototype.match = function (literal) {
        return this.then(literal);
    };
    EngExp.prototype.then = function (pattern) {
        this.pattern += "(?:" + EngExp.sanitize(pattern) + ")";
        return this;
    };
    EngExp.prototype.startOfLine = function () {
        this.prefixes = "^" + this.prefixes;
        return this;
    };
    EngExp.prototype.endOfLine = function () {
        this.suffixes = this.suffixes + "$";
        return this;
    };
    EngExp.prototype.zeroOrMore = function (pattern) {
        if (pattern)
            return this.then(pattern.zeroOrMore());
        else {
            this.pattern = "(?:" + this.pattern + ")*";
            return this;
        }
    };
    EngExp.prototype.oneOrMore = function (pattern) {
        if (pattern)
            return this.then(pattern.oneOrMore());
        else {
            this.pattern = "(?:" + this.pattern + ")+";
            return this;
        }
    };
    EngExp.prototype.optional = function () {
        this.pattern = "(?:" + this.pattern + ")?";
        return this;
    };
    EngExp.prototype.maybe = function (pattern) {
        this.pattern += "(?:" + pattern + ")?";
        return this;
    };
    EngExp.prototype.anythingBut = function (characters) {
        this.pattern += "[^" + EngExp.sanitize(characters) + "]*";
        return this;
    };
    // solution
    /*
    or(pattern: string | EngExp): EngExp {
        this.pattern = `(?:(?:${this.pattern})|(?:${EngExp.sanitize(pattern)}))`;
        return this;
    }
    */
    EngExp.prototype.digit = function () {
        this.pattern += "\\d";
        return this;
    };
    EngExp.prototype.repeated = function (from, to) {
        this.pattern = "(?:" + this.pattern + "){" + from + "," + to + "}";
        return this;
    };
    EngExp.prototype.multiple = function (pattern, from, to) {
        this.pattern += "(?:" + EngExp.sanitize(pattern) + "){" + from + "," + to + "}";
        return this;
    };
    EngExp.prototype.or = function (pattern) {
        // since | has the lowest precedence even below the characters
        // we need not enclose the current pattern within ()
        // this.pattern = `(?:${this.pattern})|(?:${EngExp.sanitize(pattern)})`; is not needed
        //
        this.pattern += "|(?:" + EngExp.sanitize(pattern) + ")";
        return this;
    };
    EngExp.prototype.beginCapture = function () {
        this.pattern += "(";
        this.suffixes = ")" + this.suffixes;
        /*
            beginCapture(): EngExp {
                this.pattern += "(";
                this.openCaptures++;
        */
        return this;
    };
    EngExp.prototype.endCapture = function () {
        this.pattern += ")";
        // my solution
        if (this.suffixes.charAt(0) == ')') {
            this.suffixes = this.suffixes.substring(1);
        }
        else {
            this.prefixes = this.prefixes + "(";
        }
        /*
                if (this.openCaptures > 0) {
                    this.pattern += ")";
                    this.openCaptures--;
                }
                else {
                    this.prefixes += "(";
                    this.pattern += ")";
                }
                return this;
            }
        
            withFlag(flag: string) {
                this.flags += flag;
        */
        return this;
    };
    EngExp.prototype.toString = function () {
        return this.asRegExp().source;
    };
    EngExp.prototype.valueOf = function () {
        return this.asRegExp().source;
    };
    return EngExp;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EngExp;
//# sourceMappingURL=engexp.js.map