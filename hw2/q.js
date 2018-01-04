/* Q is a small query language for JavaScript.
 *
 * Q supports simple queries over a JSON-style data structure,
 * kinda like the functional version of LINQ in C#.
 *
 * ©2016, Pavel Panchekha and the University of Washington.
 * Released under the MIT license.
 */

//// The AST

// This class represents all AST Nodes.
function ASTNode(type) {
    this.type = type;
}

ASTNode.prototype = {};

// The All node just outputs all records.
function AllNode() {
    ASTNode.call(this, "All");
}

// This is how we make AllNode subclass from ASTNode.
AllNode.prototype = Object.create(ASTNode.prototype);
 
// The Filter node uses a callback to throw out some records.
function FilterNode(callback) {
    ASTNode.call(this, "Filter");
    this.callback = callback;
}

FilterNode.prototype = Object.create(ASTNode.prototype);
 
// The Then node chains multiple actions on one data structure.
function ThenNode(first, second) {
    ASTNode.call(this, "Then");
    this.first = first;
    this.second = second;
}

ThenNode.prototype = Object.create(ASTNode.prototype);

//// Executing queries

ASTNode.prototype.execute = function(table) {
    throw new Error("Unimplemented AST node " + this.type)
}

// ...
AllNode.prototype.execute = function (input) {
	// console.log("AllNode");
	// console.log(input);
	// console.log(input);
	
	return input;
};

FilterNode.prototype.execute = function (input) {
	var output = [];
	for (let elt of input) {
		if (this.callback.call(this, elt) == true) {
			output.push(elt);
		}
	}
		
	// console.log("FilterNode");
	// console.log(input);
	// console.log(output);
	
	return output;
};

ThenNode.prototype.execute = function (input) {
	var output = this.second.execute(this.first.execute(input));
	
	// console.log("ThenNode");
	// console.log(input);
	// console.log(output);
	
	return output;
};

//// Write a query
// Define the `thefts_query` and `auto_thefts_query` variables

var thefts_query = new ThenNode(
            new AllNode(),
            new FilterNode(function(x) {return x[13].includes("THEFT");}));

var auto_thefts_query = new ThenNode(
            new AllNode(),
            new FilterNode(function(x) {return x[13].includes("VEH-THEFT");}));

//// Add Apply and Count nodes

// ...
// The Apply node applies applyFn on all records.
function ApplyNode(applyFn) {
    ASTNode.call(this, "All");
	this.applyFn = applyFn;
}

ApplyNode.prototype = Object.create(ASTNode.prototype);

// The Count node just returns count of records.
function CountNode() {
    ASTNode.call(this, "All");
}

CountNode.prototype = Object.create(ASTNode.prototype);


ApplyNode.prototype.execute = function (input) {
	var output = [];
	for (let elt of input) {
		output.push(this.applyFn.call(this, elt));
	}
		
	// console.log("ApplyNode");
	// console.log(input);
	// console.log(output);
	return output;
};

CountNode.prototype.execute = function (input) {
	// console.log("CountNode");
	// console.log(input);
	
	var output = [];
	output.push(input.length);
	// console.log(output);
	return output;
};



//// Clean the data

var cleanup_query = new ApplyNode(function(x) {
							return ({type: x[13], description: x[15], date: x[17], area: x[18]});
						});

//// Implement a call-chaining interface

// ...
Q = Object.create(new AllNode());

ASTNode.prototype.filter = function(callback) {
	return new ThenNode(this, new FilterNode(callback));
};

ASTNode.prototype.apply = function(applyFn) {
	return new ThenNode(this, new ApplyNode(applyFn));
};

ASTNode.prototype.count = function() {
	return new ThenNode(this, new CountNode());
};

//// Reimplement queries with call-chaining

var cleanup_query_2 = Q.apply(function(x) {
							return ({type: x[13], description: x[15], date: x[17], area: x[18]});
						}); // ...

var thefts_query_2 = Q.filter(function(x) {return x["type"].includes("THEFT");}); // ...

var auto_thefts_query_2 = thefts_query_2.filter(function(x) {return x["type"].includes("VEH-THEFT");}); // ...

//// Optimize filters

ASTNode.prototype.optimize = function() { return this; }

ThenNode.prototype.optimize = function() {
    return new ThenNode(this.first.optimize(), this.second.optimize())
}

// We add a "run" method that is like "execute" but optimizes queries first.

ASTNode.prototype.run = function(data) {
    this.optimize().execute(data);
}

function AddOptimization(node_type, f) {
    var old = node_type.prototype.optimize;
    node_type.prototype.optimize = function() {
        var new_this = old.apply(this, arguments);
        return f.apply(new_this, arguments) || new_this;
    }
}

// ...

// Optimize ThenNode(ThenNode(x, FilterNode(f)), FilterNode(g)) to ThenNode(x, FilterNode(f && g))
// 
AddOptimization.call(this, ThenNode, function() {
	if (this.second instanceof FilterNode && 
			this.first instanceof ThenNode &&
			this.first.second instanceof FilterNode) {
		var newtree = new ThenNode(this.first.first, 
							new FilterNode(function() {
									this.first.second.callback && this.second.callback; 
								}
							)
						);
		return newtree;
	}
});

//// Internal node types and CountIf

// ...

function CountIfNode(callback) {
    ASTNode.call(this, "CountIf");
    this.callback = callback;
}

CountIfNode.prototype = Object.create(ASTNode.prototype);


CountIfNode.prototype.execute = function (input) {
	var output = [];
	var count = 0;
	for (let elt of input) {
		if (this.callback.call(this, elt) == true) {
			count++;
		}
	}
	
	output.push(count);
	
	// console.log("CountIfNode");
	// console.log(input);
	// console.log(output);
	
	return output;
};

// Optimize Then(Then(x, Filter(f)), Count) to Then(x, CountIf(f))
// 
AddOptimization.call(this, ThenNode, function() {
	if (this.second instanceof CountNode && 
			this.first instanceof ThenNode &&
			this.first.second instanceof FilterNode) {
		var newtree = new ThenNode(this.first.first, new CountIfNode(this.first.second.callback));
		return newtree;
	}
});

//// Cartesian Products

// ...

function CartesianProductNode(first, second) {
    ASTNode.call(this, "CartesianProduct");
    this.first = first;
    this.second = second;
}

CartesianProductNode.prototype = Object.create(ASTNode.prototype);

CartesianProductNode.prototype.execute = function(input) {
	var set1 = this.first.execute(input);
	var set2 = this.second.execute(input);
	
	var output = [];
	for (elt1 of set1) {
		for (elt2 of set2) {
			output.push({left: elt1, right: elt2});
		}
	}
	
	return output;
}

CartesianProductNode.prototype.optimize = function() {
    return new CartesianProductNode(this.first.optimize(), this.second.optimize())
}

//// Joins

// ...

ASTNode.prototype.product = function(set1, set2) {
	return new CartesianProductNode(set1, set2);
};

var joinApplyFn = function(x) {
	var left = x["left"];
	var right = x["right"];
	
	var output = [];
	
	for (elt in right) {
		if (right.hasOwnProperty(elt)) {
			output[elt] = right[elt];
		}
	}
	
	for (elt in left) {
		if (left.hasOwnProperty(elt) && 
				(!output.hasOwnProperty(elt) || output[elt] == null)) {
			output[elt] = left[elt];
		}
	}
	
	return output;
};

ASTNode.prototype.join = function(joinFn, set1, set2) {
	var filterFunction = function(x) { 
			return joinFn.call(this, x["left"], x["right"]);
		};
	filterFunction.createType = joinFn.createType;
	filterFunction.fieldName = joinFn.fieldName;
	var filtered = new ThenNode(new CartesianProductNode(set1, set2), 
							new FilterNode(filterFunction)
					);
					
	return new ThenNode(filtered, new ApplyNode(joinApplyFn));
};



//// Optimizing joins

// ...
function JoinNode(joinFn, first, second) {
    ASTNode.call(this, "Join");
    this.first = first;
    this.second = second;
	this.joinFn = joinFn;
}

JoinNode.prototype = Object.create(ASTNode.prototype);

JoinNode.prototype.execute = function(input) {
	var set1 = this.first.execute(input);
	var set2 = this.second.execute(input);
	
	var filtered = [];
	for (elt1 of set1) {
		for (elt2 of set2) {
			if(joinFn.call(this, elt1, elt2)) {
				filtered.push({left: elt1, right: elt2});
			}
		}
	}
	
	var output = [];
	
	for (x in filtered) {
		output.push(joinApplyFn.call(this, x));
	}
	
	return output;
}

JoinNode.prototype.optimize = function() {
    return new JoinNode(this.joinFn, this.first.optimize(), this.second.optimize())
}

// Optimize Then(Then(CartesianProduct, Filter(joinFn)), Apply) to Join(joinFn)
// 
AddOptimization.call(this, ThenNode, function() {
	if (this.second instanceof ApplyNode && 
			this.second.applyFn == joinApplyFn &&
			this.first instanceof ThenNode &&
			this.first.second instanceof FilterNode &&
			this.first.first instanceof CartesianProductNode) {
		var newtree = new JoinNode(this.first.second.callback, this.first.first.first, this.first.first.second);
		return newtree.optimize();
	}
});



//// Join on fields

// ...

ASTNode.prototype.on = function(fieldName) {
	var resultJoinFunction = function (left, right) {
		return left[fieldName] == right[fieldName];
	}
	
	resultJoinFunction.fieldName = fieldName;
	resultJoinFunction.createType = "On";
	
	return resultJoinFunction;
};


//// Implement hash joins

// ...
function HashJoinNode(fieldName, first, second) {
    ASTNode.call(this, "HashJoin");
    this.first = first;
    this.second = second;
	this.fieldName = fieldName;
}

HashJoinNode.prototype = Object.create(ASTNode.prototype);

HashJoinNode.prototype.execute = function(input) {
	var set1 = this.first.execute(input);
	var set2 = this.second.execute(input);
	
	var hashtable1 = [];
	for (elt of set1) {
		if(hashtable1[elt[this.fieldName]] == null) {
			var out = [];
			out.push(elt);
			hashtable1[elt[this.fieldName]] = out;
		} else {
			hashtable1[elt[this.fieldName]].push(elt);
		}	
	}

	var hashtable2 = [];
	for (elt of set2) {
		if(hashtable2[elt[this.fieldName]] == null) {
			var out = [];
			out.push(elt);
			hashtable2[elt[this.fieldName]] = out;
		} else {
			hashtable2[elt[this.fieldName]].push(elt);
		}
	}
	
	var finalOutput = [];
	
	for (var k in hashtable1) {
		if(hashtable1.hasOwnProperty(k)) {
			var setA = hashtable1[k];
			var setB = (hashtable2[k] == null) ? [] : hashtable2[k];
			for (eltB of setB) {
				for (eltA of setA) {
					var out = eltB;
					for (var prop in eltA) {
						if (eltA.hasOwnProperty(prop)) {
							if(!out.hasOwnProperty(prop) || out[prop] == null) {
								out[prop] = eltA[prop];
							}
						}
					}
					finalOutput.push(out);
				}
			}
		}
	}
		
	return finalOutput;
}

HashJoinNode.prototype.optimize = function() {
    return new HashJoinNode(this.fieldName, this.first.optimize(), this.second.optimize())
}

//// Optimize joins on fields to hash joins

// ...


// Optimize JoinNode(Q.on(fieldName), Q, Q) to HashJoin(fieldName, Q, Q)
// 

AddOptimization.call(this, JoinNode, function() {
	if (this.joinFn.createType == "On") {
		var newtree = new HashJoinNode(this.joinFn.fieldName, this.first, this.second);
		return newtree;
	}
});
/* 
AddOptimization.call(this, ThenNode, function() {
	if (this.second instanceof ApplyNode && 
			this.second.applyFn == joinApplyFn &&
			this.first instanceof ThenNode &&
			this.first.second instanceof FilterNode &&
			this.first.first instanceof CartesianProductNode &&
			this.first.second.callback.createType == "On") {
		var newtree = new HashJoinNode(this.first.second.callback.fieldName, this.first.first.first, this.first.first.second);
		return newtree;
	}
});


 */