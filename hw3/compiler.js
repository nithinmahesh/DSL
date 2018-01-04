var antlr4 = require('antlr4/index');
var HandlebarsLexer = require('HandlebarsLexer').HandlebarsLexer;
var HandlebarsParser = require('HandlebarsParser').HandlebarsParser;
var HandlebarsParserListener = require('HandlebarsParserListener').HandlebarsParserListener;

function HandlebarsCompiler() {
    HandlebarsParserListener.call(this);
    this._inputVar = "__$ctx";
    this._outputVar = "__$result";
    this._helpers = { expr: {}, block: {} };
	this._usedHelpers = [];
	this._funcNamePrefix = "__$";
	this._currentIndent = "";
	this.registerBlockHelper('each', function (ctx, body, list) {
            var output = "";
			for (elt in list) {
				output += body(list[elt]);
			}
			return output;
        });
    this.registerBlockHelper('if', function (ctx, body, condition) {
            var output = "";
			if (condition) {
				output += body(ctx);
			}
			return output;
        });
    this.registerBlockHelper('with', function (ctx, body, fieldName) {
			return body(ctx[fieldName]);
        });
    return this;
}

HandlebarsCompiler.prototype = Object.create(HandlebarsParserListener.prototype);
HandlebarsCompiler.prototype.constructor = HandlebarsCompiler;

HandlebarsCompiler.escape = function (string) {
    return ('' + string).replace(/["'\\\n\r\u2028\u2029]/g, function (c) {
        switch (c) {
            case '"':
            case "'":
            case '\\':
                return '\\' + c;
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\u2028':
                return '\\u2028';
            case '\u2029':
                return '\\u2029';
        }
    })
};

HandlebarsCompiler.prototype.registerExprHelper = function(name, helper) {
    this._helpers.expr[name] = helper;
};

HandlebarsCompiler.prototype.registerBlockHelper = function (name, helper) {
    this._helpers.block[name] = helper;
};

HandlebarsCompiler.prototype.pushScope = function () {
	var newBodySource = this._currentIndent + `var ${this._outputVar} = "";\n`;
	this._bodyStack.push(newBodySource);
}

HandlebarsCompiler.prototype.popScope = function () {
	this._bodyStack[this._bodyStack.length - 1] += this._currentIndent + `return ${this._outputVar};\n`;
	
	return this._bodyStack.pop();
}

HandlebarsCompiler.prototype.compile = function (template) {
    this._bodyStack = [];
	this.pushScope();
	
	this._usedHelpers = [];
    var chars = new antlr4.InputStream(template);
    var lexer = new HandlebarsLexer(chars);
    var tokens = new antlr4.CommonTokenStream(lexer);
    var parser = new HandlebarsParser(tokens);
    parser.buildParseTrees = true;
    var tree = parser.document();
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(this, tree);

	this.generateHelperFunctionsCode();
	var resultCode = this.popScope();
	console.log(resultCode);
    return new Function(this._inputVar, resultCode);
};

HandlebarsCompiler.prototype.append = function (expr) {
	this._bodyStack[this._bodyStack.length - 1] += this._currentIndent + `${this._outputVar} += ${expr};\n`
};

HandlebarsCompiler.prototype.appendToCtxSource = function (expr, ctx) {
	ctx.source += `${expr}`;
};

HandlebarsCompiler.prototype.exitRawElement = function (ctx) {
    this.append(`"${HandlebarsCompiler.escape(ctx.getText())}"`);
};

 
HandlebarsCompiler.prototype.enterIdentifier = function (ctx) {
	ctx.source = ``;
};

HandlebarsCompiler.prototype.exitIdentifier = function (ctx) {
	this.appendToCtxSource(`${HandlebarsCompiler.escape(this._funcNamePrefix + "ctx." + ctx.getText())}`, ctx);
};
 
HandlebarsCompiler.prototype.exitExpressionElement = function (ctx) {
	ctx.source = ctx.getChild(1).source;
	this._bodyStack[this._bodyStack.length - 1] += this._currentIndent + `${this._outputVar} += ${ctx.source};\n`;
	console.log(this._bodyStack[this._bodyStack.length - 1]);
};

HandlebarsCompiler.prototype.exitExpressionContent = function (ctx) {
	if(ctx.getChildCount() == 1) {
		ctx.source = ctx.getChild(0).source;	
	} else if (ctx.getChildCount() == 3) {
		ctx.source = ctx.getChild(1).source;
	}
};

HandlebarsCompiler.prototype.exitHelperExpressionParams = function (ctx) {
	if (ctx.getChildCount() == 1) {
		ctx.source = ctx.getChild(0).source;
	} else if (ctx.getChildCount() == 3) {
		ctx.source = ctx.getChild(1).source;
	} 
};

HandlebarsCompiler.prototype.exitHelperExpression = function (ctx) {
	ctx.source = `${this._funcNamePrefix}${HandlebarsCompiler.escape(ctx.getChild(0).getText())}(__$ctx`;
	var childCount = ctx.getChildCount();
	for(i = 1; i < childCount; i++) {
		ctx.source += `, ${ctx.getChild(i).source}`;
	}
	ctx.source += `)`;
	this._usedHelpers.push(HandlebarsCompiler.escape(ctx.getChild(0).getText()));
};

HandlebarsCompiler.prototype.exitLiteral = function (ctx) {
	ctx.source = ctx.getText();
};

HandlebarsCompiler.prototype.generateHelperFunctionsCode = function() {
	var helperFunctionsCode = ``;
	for (k in this._helpers.expr) {
		if (this._helpers.expr.hasOwnProperty(k) && 
				this._usedHelpers.includes(k)) {
		helperFunctionsCode += this._currentIndent + `var ${this._funcNamePrefix}${k} = ${this._helpers.expr[k].toString()};\n`;
		} 
	}
	for (k in this._helpers.block) {
		if (this._helpers.block.hasOwnProperty(k) && 
				this._usedHelpers.includes(k)) {
		helperFunctionsCode += this._currentIndent + `var ${this._funcNamePrefix}${k} = ${this._helpers.block[k].toString()};\n`;
		} 
	}
	this._bodyStack[this._bodyStack.length - 1] = helperFunctionsCode + this._bodyStack[this._bodyStack.length - 1];
};

HandlebarsCompiler.prototype.enterBlockElement = function (ctx) {
    this._currentIndent += "\t\t";
	this.pushScope();
};

HandlebarsCompiler.prototype.exitBlockElement = function (ctx) {
    var funcContent = this.popScope();
	
	this._currentIndent = this._currentIndent.substring(2);
	
	funcContent = this._currentIndent + `\tfunction(${this._funcNamePrefix}ctx) {\n` + 
					funcContent +
					this._currentIndent + `\t}`;
	
	var blockStart = HandlebarsCompiler.escape(ctx.getChild(0).getChild(2).getChild(0).getText());
	var blockEnd = HandlebarsCompiler.escape(ctx.getChild(ctx.getChildCount() - 1).getChild(2).getText());
	if (blockStart != blockEnd) {
		// Block start and end tags don't match
		//
		throw "Block start '" + 
			blockStart + 
			"' does not match the block end '" + 
			blockEnd + "'.";
	}
	
	ctx.source = this._currentIndent + `${this._outputVar} += ${this._funcNamePrefix}${blockStart}` +
					`(${this._funcNamePrefix}ctx,\n` + 
					funcContent;
	
	for (var i = 1; i < ctx.getChild(0).getChild(2).getChildCount(); i++) {
		ctx.source += `,\n`+ 
					this._currentIndent + `\t` +
					`${ctx.getChild(0).getChild(2).getChild(i).source}`
	}
	
	ctx.source += `);\n`;
	this._bodyStack[this._bodyStack.length - 1] += ctx.source;
};

exports.HandlebarsCompiler = HandlebarsCompiler;
