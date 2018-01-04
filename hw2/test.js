
"use strict";

mocha.setup("bdd");

function clean_data() {
    var out = [];
    for (var i = 0; i < window.raw_data.length; i++) {
        var x = window.raw_data[i];
        out.push({type: x[13], description: x[15], date: x[17], area: x[18]});
    }
    return out;
}

describe("Problem 1", function() {
    it("Executing queries", function() {
        var q = new ThenNode(
            new AllNode(),
            new FilterNode(function(x) {return x[0] % 2;}));
        var out = q.execute(window.raw_data);
        
        var good = [];
        for (var i = 0; i < window.raw_data.length; i++) {
            if (raw_data[i][0] % 2) {
                good.push(raw_data[i]);
            }
        }
        chai.expect(out).to.be.an("Array");
        chai.expect(out).to.deep.equal(good);
    });

    it("Write a query", function() {
        var good1 = [];
        var good2 = [];
        for (var i = 0; i < window.raw_data.length; i++) {
            if (raw_data[i][13].match(/THEFT/)) {
                good1.push(raw_data[i]);
            }
            if (raw_data[i][13].match(/^VEH-THEFT/)) {
                good2.push(raw_data[i]);
            }
        }
        
        var out1 = thefts_query.execute(window.raw_data);
        var out2 = auto_thefts_query.execute(window.raw_data);
        
        chai.expect(out1).to.deep.equal(good1);
        chai.expect(out2).to.deep.equal(good2);
    });

    it("Add Apply and Count nodes", function() {
        var q = new ThenNode(
            new ApplyNode(function(x) {return x[0] % 2;}),
            new ThenNode(
                new FilterNode(function(x) {return x;}),
                new CountNode()));
        var out = q.execute(window.raw_data);

        var good = 0;
        for (var i = 0; i < window.raw_data.length; i++) {
            if (raw_data[i][0] % 2) good++;
        }
        chai.expect(out).to.be.an("Array");
        chai.expect(out).to.have.length(1);
        chai.expect(out[0]).to.equal(good);
    });
    
    it("Clean the data", function() {
        var out = cleanup_query.execute(window.raw_data);
        chai.expect(out).to.deep.equal(clean_data());
    });
    
    it("Implement a call-chaining interface", function() {
        var q = Q
            .apply(function(x) {return x[0] % 2})
            .filter(function(x) {return x})
            .count();
        var out = q.execute(window.raw_data);

        var good = 0;
        for (var i = 0; i < window.raw_data.length; i++) {
            if (raw_data[i][0] % 2) good++;
        }

        chai.expect(out).to.be.an("Array");
        chai.expect(out).to.have.length(1);
        chai.expect(out[0]).to.equal(good);
    });

    it("Reimplement queries with call-chaining", function() {
        var data = clean_data();
        var out = cleanup_query_2.execute(window.raw_data);
        chai.expect(out).to.deep.equal(data);

        var good1 = [];
        var good2 = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].type.match(/THEFT/)) {
                good1.push(data[i]);
            }
            if (data[i].type.match(/^VEH-THEFT/)) {
                good2.push(data[i]);
            }
        }
        
        var out1 = thefts_query_2.execute(data);
        var out2 = auto_thefts_query_2.execute(data);
        chai.expect(out1).to.deep.equal(good1);
        chai.expect(out2).to.deep.equal(good2);
    });
});

describe("Problem 2", function() {
    it("Optimize filters", function() {
        var q = Q.filter(function(x){return x}).filter(function(x){return x});
        var q2 = q.optimize();
        chai.expect(q2.type).to.equal("Then");
        chai.expect(q2.first.type).to.equal("All");
        chai.expect(q2.second.type).to.equal("Filter");
    });

    it("Internal node types and CountIf", function() {
        var q = Q.filter(function(x){return x[0]%2}).count();
        var q2 = q.optimize();
        chai.expect(q2.type).to.equal("Then");
        chai.expect(q2.first.type).to.equal("All");
        chai.expect(q2.second.type).to.equal("CountIf");
    });
});

describe("Problem 3", function() {
    it("Cartesian products", function() {
        var q = new CartesianProductNode(new AllNode(), new AllNode());
        var out = q.execute(window.raw_data);
        var l = window.raw_data.length;
        chai.expect(out).to.have.length(l*l);
    });
    
    it("Joins", function() {
        var q = Q.join(function(l, r) { return l[0] == r[0] - 1 }, Q, Q)
            .apply(function(x) { return x[0] });
        var out = q.execute(window.raw_data);
        var l = window.raw_data.slice(1);
        chai.expect(out).to.deep.equal(l.map(function(x) {return x[0]}));
    });
    
    it("Optimizing joins", function() {
        var q = Q.join(function(l, r) { return l[0] == r[0] - 1 }, Q, Q);
        var out = q.optimize();
        chai.expect(out.type).to.equal("Join");
    });
    
    it("Joins on fields", function() {
        var q = Q.join(Q.on("type"), Q, Q).count()
        var out = q.execute(clean_data());
        
        var good = 0;
        for (var i = 0; i < window.raw_data.length; i++) {
            for (var j = 0; j < window.raw_data.length; j++) {
                if (window.raw_data[i][13] == window.raw_data[j][13]) good++;
            }
        }
        
        chai.expect(out).to.be.an("Array");
        chai.expect(out).to.have.length(1);
        chai.expect(out[0]).to.equal(good);
    });

    it("Implement hash joins", function() {
        var q = new HashJoinNode("type", new AllNode(), new AllNode()).count()
        var out = q.execute(clean_data());
        
        var good = 0;
        for (var i = 0; i < window.raw_data.length; i++) {
            for (var j = 0; j < window.raw_data.length; j++) {
                if (window.raw_data[i][13] == window.raw_data[j][13]) good++;
            }
        }
        
        chai.expect(out).to.be.an("Array");
        chai.expect(out).to.have.length(1);
        chai.expect(out[0]).to.equal(good);
    });

    it("Optimize joins on fields to hash joins", function() {
        var q = Q.join(Q.on("type"), Q, Q)
        var out = q.optimize();
        chai.expect(out.type).to.equal("HashJoin");
    });
});
