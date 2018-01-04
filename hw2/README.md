μDB, an in-memory query language
=======================================

In this assignment, you implement a query language for simple
Javascript data structure. A lot of data is available as JSON; this
query language will be useful for working with that data.

This query language is a *deeply embedded interpreter*: it turns
queries into an abstract syntax tree, which are then interpreted by
walking that tree.

Eventually, we'd like to be able to use udb like this:

    var data = [ { name: "Ras Bodik", value: 10 }, ... ];
    var query = udb.filter(function(x) { return x.value > 8 });
    var out = query.execute(data);

Right now, you have a skeleton containing just the definitions of AST
nodes and some function signatures to fill out, plus some comments in
case you're not too familiar with JavaScript.

# How μDB works

Eventually, μDB should work by first having the user construct a
*query*, which is an abstract syntax tree defining the operation
they'd like to do; and then *running* the query.

Right now there's no way to construct queries except by manually
constructing AST nodes, and no way to execute queries at all.

Three types of AST nodes are currently supported:

+ `AllNode()`: This returns the whole table without changing it.
+ `FilterNode(f)`: This runs `f` on each entry in the table and keeps
  only the records where `f` returned `true`.
+ `ThenNode(first, second)`: This first executing the `first` query on
  the whole table and then executing `second` query on its results.

Each of them can be constructed manually with `new`; the above query
can be constructed so:

    new FilterNode(function(x) { return x.value > 8 })

Right now `AllNode` is useless, but it'll be handy later on when you
implement joins.

# How AST nodes are defined

Each AST node is a class inheriting from the `ASTNode` class. Classes
and inheritance in JavaScript is a bit weird, so use these AST nodes
as examples to crib from.

To define a class in Javascript you actually define the constructor
function:

    function ThenNode(first, second) {
        ASTNode.call(this, "Then");
        this.first = first;
        this.second = second;
    }

The line `ASTNode.call(this, "Then")` calls the constructor for
`ASTNode`s, which takes as its only argument a string defining the
node type.

The lines `this.first = first` and `this.second = second` store the
constructor arguments `first` and `second` into fields of the
constructed object. In JavaScript there's no need to define field
names up front or give them types.

Once this constructor is defined we must make the new class inherit
from `ASTNode`. To do that we use the magic incantation

    ThenNode.prototype = Object.create(ASTNode.prototype);

This assignment introduction is a little small to describe prototype
inheritance in; suffice it to say that this magic incantation does the
job.

Finally, new method can be defined on a class like so:

    ASTNode.prototype.filter = function() {
        ...
    }

This defines the `filter` method on `ASTNode`, which would be
available on nodes of any type, since they all inherit from `ASTNode`.

The assignment skeleton includes definitions of all three node types.

# Question 1: executing queries

The first step toward a usable query language is implementing the
`execute` method on AST nodes. This method should take a table—a
JavaScript array, nothing more—and return a new table with the results
of executing the query.

Make sure never to modify the input table; for example, the
`FilterNode` shouldn't delete records from the table, but should
instead copy records to a new table and return that.

Implement three `execute` methods: on `AllNode`s, on `FilterNode`s,
and on `ThenNode`s. Note that `ASTNode`s have an `execute` method that
throws an exception.

*Hint*: You'll want to recursively execute the first and second
queries to execute a `ThenNode`.

# Question 2: writing a query

The assignment skeleton includes some code to load recent Seattle
crime data from the Seattle police department, made available through
[https://data.gov](Data.gov). This data has every major crime reported
in Seattle over the last 48 hours, and it should update every time you
reload the web page.

The data is stored in the `raw_data` global variable; the data format
is an array of arrays, one per crime, where the array for a crime has
the crime type at index 13, the crime description at index 15, the
crime date as a Unix timestamp at index 17, and the crime location
(approximate, usually) at index 18. The other indices contain data
that we won't be using; you can find a full description at **TODO**.

Write one query that selects all the thefts in this data set, and
another that selects all the auto thefts. When I ran my query, I had
63 major crimes, of which 36 were thefts, and 12 of which were auto
thefts. Your numbers will be different, but that should give you a
sense of what numbers to expect.

# Question 3: adding Apply and Count nodes

Add two more types of query nodes:

+ `ApplyNode(f)`: This runs `f` on every record in the table and
  collects the results in a new table.
+ `CountNode()`: This returns a table with a single entry, containing
  the number of entries in the table.

For each node, you will need to define the constructor, make it
inherit from `ASTNode`, and define an `execute` method.

# Question 4: cleaning up the data

Since we will only be using the crime type, description, date, and
location information, write a query that transforms the crime arrays
into an objects with fields `type`, `description`, `date`, and `area`.

Execute this query and store the results in the variable `clean_data`.

# Question 5: a call-chaining interface

It's pretty inconvenient to build query ASTs manually. Make it easier
by defining `filter`, `apply`, and `count` functions on `ASTNode`s
that build new AST nodes. These methods should allow call-chaining.

For convenience, I've defined the variable `udb` to be an `AllNode`
that you can define extra properties on without them being available
on other `AllNode`s. You can use this to make `udb` a namespace for
helper functions and also the base for call-chaining query
construction.

# Question 6: call-chaining queries

Translate the queries from Questions 2 and 4 to the call-chaining
interface.

# Optimizing queries

One of the benefits of using call-chaining to build an AST, which is
then separately run, is that the program can be analyzed and changed
before being executed. We'll use that ability to do some basic
optimizations.

To optimize a program, you simply look at the program and replace it
with a different, better program. We'll do that by traversing the
program tree, much like in the `execute` call, and producing a new
program tree. Usually this new program tree will be no different from
the old tree, but some patterns can be replaced by more-efficient
implementations.

To do this we've defined the `optimize` function on `ASTNode`s to
return the node unchanged, and an `optimize` function on `ThenNode`s
to recursively optimize the node's children.

To help you separate different optimizations, we've provided the
`addOptimization` function, which you can use like this:

    addOptimization(ThenNode, function() {
        if (...) {
            return ...;
        }
    });

This incantation modifies the `ThenNode` `optimize` function to also
run the test and use the return value if it passes.

# Question 7: optimizing filters

Your task in this example is optimizing two `filter` calls to a single
`filter` operation. Each filter means traversing the whole data table;
if we want to filter the data multiple times, the costs of the extra
traversals add up. Instead of traversing the data twice to filter it
twice, it would be better to traverse it once, and keep all the data
that matches both filters.

To do this, we want to detect the pattern:

    ThenNode(ThenNode(x, FilterNode(f)), FilterNode(g))

and replace it with:

    ThenNode(x, FilterNode(f && g))

Your task will be to modify the `ThenNode` `optimize` function to
detect the inefficient pattern and return the replacement tree instead.

Print the original and optimized form of the queries from Question 6.

# Internal node types

Using patterns like those in Question 7, we can implement a lot of
optimizations that together would make our query language pretty fast.
But some combinations, like an `apply` followed by a `filter`,
would still do multiple traversals of the data, because there's no
node that does both function application and filtering.

To make these optimizations possible, we add new "internal" node types
to our query language. These nodes are never written manually by the
user; they are only generated by the optimizer.

# Question 8: adding CountIf

Optimize the common pattern of first `filter`ing the data and then
`count`ing it. Add a new `CountIf(f)` node and replace the pattern:

    Then(Then(x, Filter(f)), Count)

with:

    Then(x, CountIf(f))

Apply this optimization to the queries from Question 7, and print their
new, even-more-optimized, form.

# Question 9: cartesian products

The cartesian product is the basis of joins on data. The cartesian
product of two queries `P` and `Q` has every possible two-element
record whose `left` field is a record returned by `P` and a `right`
field with a record returned by `Q`.
