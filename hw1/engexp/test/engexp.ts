///<reference path="../typings/main.d.ts"/>

import {expect} from "chai";
import EngExp from "../src/engexp";

describe("EngExp", () => {	
    it("should parse a basic URL", () => {
        let e = new EngExp()
            .startOfLine()
            .then("http")
            .maybe("s")
            .then("://")
            .maybe("www.")
            .anythingBut(" ")
            .endOfLine()
            .asRegExp();
		console.log(e);
        expect(e.test("https://www.google.com/maps")).to.be.true;
		expect(e.test("https://google.com/maps")).to.be.true;
    });

    it("should parse a disjunctive date pattern", () => {
        let e = new EngExp()
            .startOfLine()
            .digit().repeated(1, 2)
            .then("/")
            .then(new EngExp().digit().repeated(1, 2))
            .then("/")
            .then(new EngExp().digit().repeated(2, 4))
            .or(
                new EngExp()
                    .digit().repeated(1, 2)
                    .then(" ")
                    .then(
                        new EngExp().match("Jan").or("Feb").or("Mar").or("Apr").or("May").or("Jun")
                            .or("Jul").or("Aug").or("Sep").or("Oct").or("Nov").or("Dec")
                    )
                    .then(" ")
                    .then(new EngExp().digit().repeated(2, 4))
            )
            .endOfLine()
            .asRegExp();
        console.log(e);
		expect(e.test("12/25/2015")).to.be.true;
        expect(e.test("25 Dec 2015")).to.be.true;
    });

    it("should capture nested groups", () => {
        let e = new EngExp()
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
		let result = e.exec("https://www.google.com/maps");
        expect(result[1]).to.be.equal("google.com/maps");
        expect(result[2]).to.be.equal("google.com");
    });
// mine	
	it("should handle missed endcaptures", () => {
		let e = new EngExp()
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
		let result = e.exec("hello world!");
        expect(result[1]).to.be.equal("hello world!");
        expect(result[2]).to.be.equal("world!");
		expect(result[3]).to.be.equal("!");
	});
	
	it("should handle missed begincaptures", () => {
		let e = new EngExp()
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
		let result = e.exec("hello world!");
        expect(result[1]).to.be.equal("hello world!");
        expect(result[2]).to.be.equal("hello world");
		expect(result[3]).to.be.equal("hello");
	});
	
	it("should handle missed begin and endcaptures as part of sub regexes", () => {
		let e = new EngExp()
			.startOfLine()
			.then("hi")
			.maybe(" ")
			.then("world")
			.or(new EngExp()
					.beginCapture()
					.then("hello")
					.maybe(" ")
					.beginCapture()
					.then("world")
					.beginCapture()
					.maybe("!"))
			.maybe(" ")
			.then(new EngExp()
					.then("i'm")
					.endCapture()
					.maybe(" ")
					.then("chitti")
					.endCapture()
					.maybe("!")
					.endCapture()
			)
			.endOfLine()
			.asRegExp();
		console.log(e);
		let result = e.exec("hello world! i'm chitti!");
        expect(result[1]).to.be.equal("hello world!");
        expect(result[2]).to.be.equal("world!");
		expect(result[3]).to.be.equal("!");
		expect(result[4]).to.be.equal("i'm chitti!");
		expect(result[5]).to.be.equal("i'm chitti");
		expect(result[6]).to.be.equal("i'm");
	});
	
	it("or should work even if the first regex is not enclosed within ()", () => {
        let e = new EngExp()
            .startOfLine()
            .digit().repeated(1, 2)
            .then("/")
            .then(new EngExp().digit().repeated(1, 2))
            .then("/")
            .then(new EngExp().digit().repeated(2, 4))
			.maybe(" ")
            .or(
                new EngExp()
                    .digit().repeated(1, 2)
                    .then(" ")
                    .then(
                        new EngExp().match("Jan").or("Feb").or("Mar").or("Apr").or("May").or("Jun")
                            .or("Jul").or("Aug").or("Sep").or("Oct").or("Nov").or("Dec")
                    )
                    .then(" ")
                    .then(new EngExp().digit().repeated(2, 4))
            )
            .endOfLine()
            .asRegExp();
        console.log(e);
		expect(e.test("12/25/2015")).to.be.true;
        expect(e.test("25 Dec 2015")).to.be.true;
    });
	
	it("multi level nesting", () => {
		let e = new EngExp()
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
		let result = e.exec("12322321");
        expect(result[1]).to.be.equal("12322321");
        expect(result[2]).to.be.equal("232");
		expect(result[3]).to.be.equal("3");
		expect(result[4]).to.be.equal("232");
		expect(result[5]).to.be.equal("3");
	});
	
	it("multi level nesting with a missing begin capture", () => {
		let e = new EngExp()
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
		let result = e.exec("12322321");
        expect(result[1]).to.be.equal("12322321");
        expect(result[2]).to.be.equal("232");
		expect(result[3]).to.be.equal("3");
		expect(result[4]).to.be.equal("232");
		expect(result[5]).to.be.equal("3");
	});
	
	it("nested ambiguous captures", () => {
		let e = new EngExp()
				.match("Hello")
				.beginCapture()
				.match("World")
				.oneOrMore()
				.match("Fubar");
		console.log(e);
		/* let result = e.exec("HelloWorldHelloWorldFubar");
		console.log(result[1]); */
	});

    it("should capture nested groups and work with disjunctions", () => {
        let e = new EngExp()
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
        let result = e.exec("https://www.google.com/maps");
        expect(result[1]).to.be.equal("google.com/maps");
        expect(result[2]).to.be.equal("google.com");
    });


    it("should capture from the beginning if unbalanced", () => {
        let e = new EngExp().startOfLine().digit().oneOrMore().endCapture().then(" ")
            .then(new EngExp().digit().oneOrMore()).asRegExp();
        console.log(e);
        let result = e.exec("15 33");
        expect(result[1]).to.be.equal("15");
    });

    it("should capture till the end if unbalanced", () => {
        let e = new EngExp().startOfLine().digit().oneOrMore().then(" ").beginCapture()
            .then(new EngExp().digit().oneOrMore()).asRegExp();
        console.log(e);
        let result = e.exec("15 33");
        expect(result[1]).to.be.equal("33");
    });

    it("should capture from the beginning of disjunction", () => {
        let e = new EngExp().startOfLine()
            .digit()
            .then(new EngExp().match("5").or("6").endCapture())
            .then(" ")
            .then(new EngExp().digit().oneOrMore()).asRegExp();
        console.log(e);
        let result = e.exec("15 33");
        expect(result[1]).to.be.equal("5");
    });

    it("should capture till the end of disjunction", () => {
        let e = new EngExp().startOfLine()
            .digit()
            .then(new EngExp().beginCapture().match("5").or("6"))
            .then(" ")
            .then(new EngExp().digit().oneOrMore()).asRegExp();console.log(e);
        let result = e.exec("15 33");
        expect(result[1]).to.be.equal("5");
    });

    it("should capture from the beginning of disjunction (nested)", () => {
        let e = new EngExp().startOfLine()
            .digit()
            .then(new EngExp().match("5").or("6").endCapture().endCapture().endCapture())
            .then(" ")
            .then(new EngExp().digit().oneOrMore()).asRegExp();
        console.log(e);
        let result = e.exec("15 33");
        expect(result[3]).to.be.equal("5");
    });

    it("should capture till the end of disjunction (nested)", () => {
        let e = new EngExp().startOfLine()
            .digit()
            .then(new EngExp().beginCapture().beginCapture().beginCapture().match("5").or("6"))
            .then(" ")
            .then(new EngExp().digit().oneOrMore()).asRegExp();console.log(e);
        let result = e.exec("15 33");
        expect(result[3]).to.be.equal("5");
    });

    it("should handle empty regexes", () => {
        let e = new EngExp().asRegExp();
        console.log(e);
        expect(e.test("")).to.be.true;
    });

    it("should separate alternatives", () => {
        let e = new EngExp()
            .startOfLine()
            .digit().or("a")
            .then(" ")
            .then(new EngExp().digit().or("b"))
            .or("z")
            .endOfLine()
            .asRegExp();
        console.log(e);
        expect(e.test("a b"), "should match 'a b'").to.be.true;
        expect(e.test("1 b"), "should match '1 b'").to.be.true;
        expect(e.test("a 1"), "should match 'a 1'").to.be.true;
        expect(e.test("1 1"), "should match '1 1'").to.be.true;
        expect(e.test("z"), "should match 'z'").to.be.true;
        expect(e.test("a a"), "should not match 'a a'").to.be.false;
        expect(e.test("b b"), "should not match 'b b'").to.be.false;
        expect(e.test("b z"), "should not match 'b z'").to.be.false;
        expect(e.test("bz"), "should not match 'bz'").to.be.false;
        expect(e.test("az"), "should not match 'az'").to.be.false;
        expect(e.test("a b z"), "should not match 'a b z'").to.be.false;
        expect(e.test("abz"), "should not match 'abz'").to.be.false;
    })
});
