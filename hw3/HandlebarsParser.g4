parser grammar HandlebarsParser;

options { language=JavaScript; tokenVocab=HandlebarsLexer; }

document : element* EOF ;

element
    : rawElement
    | expressionElement
    | blockElement
    | commentElement
    ;

rawElement  
	: BRACE TEXT
	| TEXT;

commentElement : START COMMENT END_COMMENT ;

expressionElement returns [source]
	: START expressionContent END
	;

expressionContent returns [source]
	: literal
	| identifier
	| OPEN_PAREN expressionContent CLOSE_PAREN
	| helperExpression
	;
	
identifier returns [source]
	: ID
	;

literal returns [source]
	: INTEGER
	| FLOAT
	| STRING
	;
	
helperExpression returns [source]
	: ID helperExpressionParams*
	;

helperExpressionParams returns [source]
	: identifier
	| literal
	| OPEN_PAREN helperExpression CLOSE_PAREN
	;
	
blockElement returns [source] 
	: blockOpeningPart element* blockClosingPart
	;
	
blockOpeningPart returns [source]
	: START BLOCK helperExpression END
	;

blockClosingPart returns [source]
	: START CLOSE_BLOCK identifier END
	;