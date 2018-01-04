///<reference path="../typings/main.d.ts"/>
"use strict";
var chai_1 = require("chai");
var engexp_1 = require("../src/engexp");
describe("EngExp", function () {
    it("should parse a basic URL", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("http")
            .maybe("s")
            .then("://")
            .maybe("www.")
            .anythingBut(" ")
            .endOfLine()
            .asRegExp();
        console.log(e);
        chai_1.expect(e.test("https://www.google.com/maps")).to.be.true;
        chai_1.expect(e.test("https://google.com/maps")).to.be.true;
    });
    it("should parse a disjunctive date pattern", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .digit().repeated(1, 2)
            .then("/")
            .then(new engexp_1.default().digit().repeated(1, 2))
            .then("/")
            .then(new engexp_1.default().digit().repeated(2, 4))
            .or(new engexp_1.default()
            .digit().repeated(1, 2)
            .then(" ")
            .then(new engexp_1.default().match("Jan").or("Feb").or("Mar").or("Apr").or("May").or("Jun")
            .or("Jul").or("Aug").or("Sep").or("Oct").or("Nov").or("Dec"))
            .then(" ")
            .then(new engexp_1.default().digit().repeated(2, 4)))
            .endOfLine()
            .asRegExp();
        console.log(e);
        chai_1.expect(e.test("12/25/2015")).to.be.true;
        chai_1.expect(e.test("25 Dec 2015")).to.be.true;
    });
    it("should capture nested groups", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("http")
            .maybe("s")
            .then("://")
            .maybe("www.")
            .beginCapture()
            .beginCapture()
            .anythingBut("/")
            .endCapture()
            .anythingBut(" ")
            .endCapture()
            .endOfLine()
            .asRegExp();
        console.log(e);
        var result = e.exec("https://www.google.com/maps");
        chai_1.expect(result[1]).to.be.equal("google.com/maps");
        chai_1.expect(result[2]).to.be.equal("google.com");
    });
    // mine	
    it("should handle missed endcaptures", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .beginCapture()
            .then("hello")
            .maybe(" ")
            .beginCapture()
            .then("world")
            .beginCapture()
            .maybe("!")
            .endOfLine()
            .asRegExp();
        console.log(e);
        var result = e.exec("hello world!");
        chai_1.expect(result[1]).to.be.equal("hello world!");
        chai_1.expect(result[2]).to.be.equal("world!");
        chai_1.expect(result[3]).to.be.equal("!");
    });
    it("should handle missed begincaptures", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("hello")
            .endCapture()
            .maybe(" ")
            .then("world")
            .endCapture()
            .maybe("!")
            .endCapture()
            .endOfLine()
            .asRegExp();
        console.log(e);
        var result = e.exec("hello world!");
        chai_1.expect(result[1]).to.be.equal("hello world!");
        chai_1.expect(result[2]).to.be.equal("hello world");
        chai_1.expect(result[3]).to.be.equal("hello");
    });
    it("should handle missed begin and endcaptures as part of sub regexes", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("hi")
            .maybe(" ")
            .then("world")
            .or(new engexp_1.default()
            .beginCapture()
            .then("hello")
            .maybe(" ")
            .beginCapture()
            .then("world")
            .beginCapture()
            .maybe("!"))
            .maybe(" ")
            .then(new engexp_1.default()
            .then("i'm")
            .endCapture()
            .maybe(" ")
            .then("chitti")
            .endCapture()
            .maybe("!")
            .endCapture())
            .endOfLine()
            .asRegExp();
        console.log(e);
        var result = e.exec("hello world! i'm chitti!");
        chai_1.expect(result[1]).to.be.equal("hello world!");
        chai_1.expect(result[2]).to.be.equal("world!");
        chai_1.expect(result[3]).to.be.equal("!");
        chai_1.expect(result[4]).to.be.equal("i'm chitti!");
        chai_1.expect(result[5]).to.be.equal("i'm chitti");
        chai_1.expect(result[6]).to.be.equal("i'm");
    });
    it("or should work even if the first regex is not enclosed within ()", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .digit().repeated(1, 2)
            .then("/")
            .then(new engexp_1.default().digit().repeated(1, 2))
            .then("/")
            .then(new engexp_1.default().digit().repeated(2, 4))
            .maybe(" ")
            .or(new engexp_1.default()
            .digit().repeated(1, 2)
            .then(" ")
            .then(new engexp_1.default().match("Jan").or("Feb").or("Mar").or("Apr").or("May").or("Jun")
            .or("Jul").or("Aug").or("Sep").or("Oct").or("Nov").or("Dec"))
            .then(" ")
            .then(new engexp_1.default().digit().repeated(2, 4)))
            .endOfLine()
            .asRegExp();
        console.log(e);
        chai_1.expect(e.test("12/25/2015")).to.be.true;
        chai_1.expect(e.test("25 Dec 2015")).to.be.true;
    });
    it("multi level nesting", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .beginCapture()
            .then("1")
            .beginCapture()
            .then("2")
            .beginCapture()
            .then("3")
            .endCapture()
            .then("2")
            .endCapture()
            .beginCapture()
            .then("2")
            .beginCapture()
            .then("3")
            .endCapture()
            .then("2")
            .endCapture()
            .then("1")
            .endCapture()
            .endOfLine()
            .asRegExp();
        console.log(e);
        var result = e.exec("12322321");
        chai_1.expect(result[1]).to.be.equal("12322321");
        chai_1.expect(result[2]).to.be.equal("232");
        chai_1.expect(result[3]).to.be.equal("3");
        chai_1.expect(result[4]).to.be.equal("232");
        chai_1.expect(result[5]).to.be.equal("3");
    });
    it("multi level nesting with a missing begin capture", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("1")
            .beginCapture()
            .then("2")
            .beginCapture()
            .then("3")
            .endCapture()
            .then("2")
            .endCapture()
            .beginCapture()
            .then("2")
            .beginCapture()
            .then("3")
            .endCapture()
            .then("2")
            .endCapture()
            .then("1")
            .endCapture()
            .endOfLine()
            .asRegExp();
        console.log(e);
        var result = e.exec("12322321");
        chai_1.expect(result[1]).to.be.equal("12322321");
        chai_1.expect(result[2]).to.be.equal("232");
        chai_1.expect(result[3]).to.be.equal("3");
        chai_1.expect(result[4]).to.be.equal("232");
        chai_1.expect(result[5]).to.be.equal("3");
    });
    it("nested ambiguous captures", function () {
        var e = new engexp_1.default()
            .match("Hello")
            .beginCapture()
            .match("World")
            .oneOrMore()
            .match("Fubar");
        console.log(e);
        /* let result = e.exec("HelloWorldHelloWorldFubar");
        console.log(result[1]); */
    });
    it("should capture nested groups and work with disjunctions", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("http")
            .or("https")
            .then("://")
            .maybe("www.")
            .beginCapture()
            .beginCapture()
            .anythingBut("/")
            .endCapture()
            .anythingBut(" ")
            .endCapture()
            .endOfLine()
            .asRegExp();
        var result = e.exec("https://www.google.com/maps");
        chai_1.expect(result[1]).to.be.equal("google.com/maps");
        chai_1.expect(result[2]).to.be.equal("google.com");
    });
    it("should capture from the beginning if unbalanced", function () {
        var e = new engexp_1.default().startOfLine().digit().oneOrMore().endCapture().then(" ")
            .then(new engexp_1.default().digit().oneOrMore()).asRegExp();
        console.log(e);
        var result = e.exec("15 33");
        chai_1.expect(result[1]).to.be.equal("15");
    });
    it("should capture till the end if unbalanced", function () {
        var e = new engexp_1.default().startOfLine().digit().oneOrMore().then(" ").beginCapture()
            .then(new engexp_1.default().digit().oneOrMore()).asRegExp();
        console.log(e);
        var result = e.exec("15 33");
        chai_1.expect(result[1]).to.be.equal("33");
    });
    it("should capture from the beginning of disjunction", function () {
        var e = new engexp_1.default().startOfLine()
            .digit()
            .then(new engexp_1.default().match("5").or("6").endCapture())
            .then(" ")
            .then(new engexp_1.default().digit().oneOrMore()).asRegExp();
        console.log(e);
        var result = e.exec("15 33");
        chai_1.expect(result[1]).to.be.equal("5");
    });
    it("should capture till the end of disjunction", function () {
        var e = new engexp_1.default().startOfLine()
            .digit()
            .then(new engexp_1.default().beginCapture().match("5").or("6"))
            .then(" ")
            .then(new engexp_1.default().digit().oneOrMore()).asRegExp();
        console.log(e);
        var result = e.exec("15 33");
        chai_1.expect(result[1]).to.be.equal("5");
    });
    it("should capture from the beginning of disjunction (nested)", function () {
        var e = new engexp_1.default().startOfLine()
            .digit()
            .then(new engexp_1.default().match("5").or("6").endCapture().endCapture().endCapture())
            .then(" ")
            .then(new engexp_1.default().digit().oneOrMore()).asRegExp();
        console.log(e);
        var result = e.exec("15 33");
        chai_1.expect(result[3]).to.be.equal("5");
    });
    it("should capture till the end of disjunction (nested)", function () {
        var e = new engexp_1.default().startOfLine()
            .digit()
            .then(new engexp_1.default().beginCapture().beginCapture().beginCapture().match("5").or("6"))
            .then(" ")
            .then(new engexp_1.default().digit().oneOrMore()).asRegExp();
        console.log(e);
        var result = e.exec("15 33");
        chai_1.expect(result[3]).to.be.equal("5");
    });
    it("should handle empty regexes", function () {
        var e = new engexp_1.default().asRegExp();
        console.log(e);
        chai_1.expect(e.test("")).to.be.true;
    });
    it("should separate alternatives", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .digit().or("a")
            .then(" ")
            .then(new engexp_1.default().digit().or("b"))
            .or("z")
            .endOfLine()
            .asRegExp();
        console.log(e);
        chai_1.expect(e.test("a b"), "should match 'a b'").to.be.true;
        chai_1.expect(e.test("1 b"), "should match '1 b'").to.be.true;
        chai_1.expect(e.test("a 1"), "should match 'a 1'").to.be.true;
        chai_1.expect(e.test("1 1"), "should match '1 1'").to.be.true;
        chai_1.expect(e.test("z"), "should match 'z'").to.be.true;
        chai_1.expect(e.test("a a"), "should not match 'a a'").to.be.false;
        chai_1.expect(e.test("b b"), "should not match 'b b'").to.be.false;
        chai_1.expect(e.test("b z"), "should not match 'b z'").to.be.false;
        chai_1.expect(e.test("bz"), "should not match 'bz'").to.be.false;
        chai_1.expect(e.test("az"), "should not match 'az'").to.be.false;
        chai_1.expect(e.test("a b z"), "should not match 'a b z'").to.be.false;
        chai_1.expect(e.test("abz"), "should not match 'abz'").to.be.false;
    });
});
//# sourceMappingURL=engexp.js.map