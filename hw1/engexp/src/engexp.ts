export default class EngExp {
    private prefixes: string = "";
    private suffixes: string = "";
    private flags: string = "m";
    private pattern: string = "";
    private openCaptures: number = 0;

    private static sanitize(s: string | EngExp): string | EngExp {
        if (s instanceof EngExp)
            return s;
        else
            return s.replace(/([\].|*?+(){}^$\\:=[])/g, "\\$&");
    }

    asRegExp(): RegExp {
        if (this.openCaptures > 0)
            this.suffixes += ")".repeat(this.openCaptures);
        return new RegExp(this.prefixes + this.pattern + this.suffixes, this.flags);
    }

    match(literal: string): EngExp {
        return this.then(literal);
    }

    then(pattern: string | EngExp): EngExp {
        this.pattern += `(?:${EngExp.sanitize(pattern)})`;
        return this;
    }

    startOfLine(): EngExp {
        this.prefixes = "^" + this.prefixes;
        return this;
    }

    endOfLine(): EngExp {
        this.suffixes = this.suffixes + "$";
        return this;
    }

    zeroOrMore(pattern?: EngExp): EngExp {
        if (pattern)
            return this.then(pattern.zeroOrMore());
        else {
            this.pattern = `(?:${this.pattern})*`;
            return this;
        }
    }

    oneOrMore(pattern?: EngExp): EngExp {
        if (pattern)
            return this.then(pattern.oneOrMore());
        else {
            this.pattern = `(?:${this.pattern})+`;
            return this;
        }
    }

    optional(): EngExp {
        this.pattern = `(?:${this.pattern})?`;
        return this;
    }

    maybe(pattern: string | EngExp): EngExp {
        this.pattern += `(?:${pattern})?`;
        return this;
    }

    anythingBut(characters: string): EngExp {
        this.pattern += `[^${EngExp.sanitize(characters)}]*`;
        return this;
    }

	// solution
	/*
    or(pattern: string | EngExp): EngExp {
        this.pattern = `(?:(?:${this.pattern})|(?:${EngExp.sanitize(pattern)}))`;
        return this;
    }
	*/

    digit(): EngExp {
        this.pattern += "\\d";
        return this;
    }

    repeated(from: number, to?: number): EngExp {
        this.pattern = `(?:${this.pattern}){${from},${to}}`;
        return this;
    }

    multiple(pattern: string | EngExp, from: number, to?: number) {
        this.pattern += `(?:${EngExp.sanitize(pattern)}){${from},${to}}`;
        return this;
    }

    or(pattern: string | EngExp): EngExp {
		// since | has the lowest precedence even below the characters
		// we need not enclose the current pattern within ()
        // this.pattern = `(?:${this.pattern})|(?:${EngExp.sanitize(pattern)})`; is not needed
		//
        this.pattern += `|(?:${EngExp.sanitize(pattern)})`; 
        return this;
    }

    beginCapture(): EngExp {
		this.pattern += `(`;
		this.suffixes = `)` + this.suffixes;
/*
    beginCapture(): EngExp {
        this.pattern += "(";
        this.openCaptures++;
*/
        return this;
    }

    endCapture(): EngExp {
		this.pattern += `)`;
// my solution
		if(this.suffixes.charAt(0) == ')')
		{
			this.suffixes = this.suffixes.substring(1);
		}
		else
		{
			this.prefixes = this.prefixes + `(`;
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
    }

    toString(): string {
        return this.asRegExp().source;
    }

    valueOf(): string {
        return this.asRegExp().source;
    }
}
