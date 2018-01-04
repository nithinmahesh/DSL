
function Stream() {
    this.callbacks = [];
	this.lastValue = null;
	this.latestCreated = null;
	this.latestProduced = null;
	this.throttling = false;
	this.values = [];
}

// PART 1 HERE

Stream.prototype.subscribe = function(callbackFunc) {
	this.callbacks.push(callbackFunc);
}

Stream.prototype._push = function(value) {
	this.lastValue = value;
	this.values.push(value);
	for (callback of this.callbacks)
	{
		callback(value);
	}
}

Stream.prototype._push_many = function(values) {
	for (value of values)
	{
		this._push(value);
	}
}

Stream.prototype.first = function() {
	var firstStream = new Stream();
	this.subscribe(function() {
		var i = 0;
		return function(x) { 
			i++; 
			if (i<=1) firstStream._push(x); 
		}
	}());
	return firstStream;
}

Stream.prototype.map = function(mapFunc) {
	var mapStream = new Stream();
	this.subscribe(function(x) { mapStream._push(mapFunc(x));});
	return mapStream;
}

Stream.prototype.filter = function(filterFunc) {
	var filterStream = new Stream();
	this.subscribe(function(x) { 
		if(filterFunc(x))
		{
			filterStream._push(x);
		}
	});
	return filterStream;
}

Stream.prototype.flatten = function() {
	var flattenStream = new Stream();
	this.subscribe(function(x) {
		for (val of x)
		{
			flattenStream._push(val);
		}
	});
	return flattenStream;
}

Stream.prototype.join = function(joinStream) {
	var mergedStream = new Stream();
	this.subscribe(function(x){
		mergedStream._push(x);
	});
	joinStream.subscribe(function(x){
		mergedStream._push(x);
	});
	return mergedStream;
}

Stream.prototype.combine = function() {
	var combineStream = new Stream();
	this.subscribe(function(x) {
		x.subscribe(function(x){
			combineStream._push(x);
		});
	});
	return combineStream;
}

Stream.prototype.zip = function(secondStream, zipFunc) {
	var zipStream = new Stream();
	var firstStream = this;
	this.subscribe(function(x){
		if(secondStream.lastValue != null)
			zipStream._push(zipFunc(x, secondStream.lastValue));
	});
	secondStream.subscribe(function(x){
		if(firstStream.lastValue != null)
			zipStream._push(zipFunc(firstStream.lastValue, x));
	});
	return zipStream;
}

Stream.timer = function(interval) {
	var timerStream = new Stream();
	var intervalId = window.setInterval(function(){
		timerStream._push(new Date());
	}, interval);
	return timerStream;
}

Stream.dom = function(element, eventname) {
	var eventStream = new Stream();
	element.on(eventname, function(event){
		eventStream._push(event);
	});
	return eventStream;
}

Stream.prototype.throttle = function(interval) {
	var newStream = new Stream();
	var currentStream = this;
	this.subscribe(function(x){
		if (currentStream.throttling == false)
		{
			currentStream.throttling = true;
			var timeoutID = window.setTimeout(function() {
				currentStream.throttling = false;
				newStream._push(currentStream.lastValue);
			}, interval);
		}		
	});
	return newStream;
}

Stream.url = function(url) {
	var urlStream = new Stream();
	var callback = function(jsonResponse) {
		urlStream._push(jsonResponse);
	}
	$.get(url, callback, 'json');
	return urlStream;
}

Stream.urlEveryMin = function(url) {
	var finalStream = new Stream();
	var timerStream = Stream.timer(60*1000);
	timerStream.subscribe(function(x){
		Stream.url(url).subscribe(function(x){
			finalStream._push(x);
		});
	});
	timerStream._push(new Date());
	return finalStream;
}

Stream.prototype.latest = function() {
	var latestStream = new Stream();
	var currentStream = this;
	this.subscribe(function(x){
		currentStream.latestCreated = x;
		thisStream = x;
		x.subscribe(function(x){
			if (currentStream.latestCreated == thisStream)
			{
				currentStream.latestProduced = thisStream;
			}
			if (currentStream.latestProduced == thisStream)
			{
				latestStream._push(x);
			}
		});
	});
	return latestStream;
}

Stream.prototype.latestWithFirstFlag = function() {
	var latestStream = new Stream();
	var currentStream = this;
	this.subscribe(function(x){
		currentStream.latestCreated = x;
		thisStream = x;
		x.subscribe(function(x){
			var first = 0;
			if (currentStream.latestCreated == thisStream)
			{
				currentStream.latestProduced = thisStream;
			}
			if (currentStream.latestProduced == thisStream)
			{
				var o = [];
				o.push(x);o.push(currentStream.latestProduced.values.length == 1);
				latestStream._push(o);
			}
		});
	});
	return latestStream;
}


/* Stream.search = function(element, eventName) {
	var baseStream = new Stream();
	var eventStream = baseStream.latest();
	element.on(eventName, function(){
		console.log($('#wikipediasearch').val());
		var stream = new Stream();
		stream.subscribe(function(x){
			$("#wikipediasuggestions").append($("<li></li>").text(x));
		});
		var callback = function(array) {
			$("#wikipediasuggestions").empty();
			for (i of array) 
			{
				stream._push(i);
			}
		};
		baseStream._push(stream);
		WIKIPEDIAGET($('#wikipediasearch').val(), callback);
	});
	return eventStream;
}
 */
 
Stream.prototype.search = function(searchFn) {
	var finalStream = new Stream();
	this.subscribe(function(searchTerm){
		var stream = new Stream();
		var callback = function(array) {
			stream._push(array);
		};
		finalStream._push(stream.flatten());
		searchFn(searchTerm, callback);
	});
	return finalStream;
}

var globalFireData = [];

Stream.prototype.unique = function(f) {
	var uniqStream = new Stream();
	var values = [];
	this.subscribe(function(x){
		if(values.includes(f(x)) == false)
		{
			values.push(f(x));
			uniqStream._push(x);
		}
	});
	
	return uniqStream;
}

Stream.prototype.searchFireData = function(element, eventName) {
	var searchedStream = new Stream();
	element.on(eventName, function(){
		searchedStream._push(element.val());
	});
	this.subscribe(function(x){
		searchedStream._push(element.val());
	});
	return searchedStream;
}

Stream.domInputBoxValue = function(element) {
	var eventStream = new Stream();
	element.on("keyup", function(event){
		eventStream._push(event.target.value);
	});
	return eventStream;
}

/*
Stream.throttledSearchFromInput = function(element, throttleDuration, searchFn){
	var finalStream = new Stream();
	element.on("keyup", function(event){
		var searchTerm = event.target.value;
		if (finalStream.throttling == false)
		{
			finalStream.throttling = true;
			var timeoutID = window.setTimeout(function() {
				finalStream.throttling = false;
				newStream._push(finalStream.lastValue);
			}, interval);
		}
		var stream = new Stream();
		var callback = function(array) {
			finalStream._push(stream.flatten());
			stream._push(array);
		};
		searchFn(searchTerm, callback);
	});
	return finalStream;
}
*/

var FIRE911URL = "https://data.seattle.gov/views/kzjm-xkqj/rows.json?accessType=WEBSITE&method=getByIds&asHashes=true&start=0&length=10&meta=false&$order=:id";

window.WIKICALLBACKS = {}

function WIKIPEDIAGET(s, cb) {
    $.ajax({
        url: "https://en.wikipedia.org/w/api.php",
        dataType: "jsonp",
        jsonp: "callback",
        data: {
            action: "opensearch",
            search: s,
            namespace: 0,
            limit: 10,
        },
        success: function(data) {cb(data[1])},
    })
}

/* 
$(function() {
    // PART 2 INTERACTIONS HERE
	var timerStream = Stream.timer(100);
	timerStream.subscribe(function(x){
		$("#time").text(x);
	});
	
	eventStream = Stream.dom($('#button'), "click");
	var count = 0;
	eventStream.subscribe(function(x){
		$("#clicks").text(++count);
	});
	
	Stream.dom($('#mousemove'), "mousemove").throttle(1000).subscribe(function(event){
		$('#mouseposition').text(event.clientX + "/" + event.clientY);
	});
	 
	// Stream.search($('#wikipediasearch'), "keyup").throttle(100);
	var eventTargetValueFn = function(event) { return event.target.value; }
	
	var wikiBase = Stream.dom($('#wikipediasearch'), "keyup").map(eventTargetValueFn).throttle(100).search(WIKIPEDIAGET);
	wikiBase.subscribe(function(x){
		
	});
	
	wikiBase.latestWithFirstFlag().subscribe(function(x){
		if (x[1] == 1)
		{
			$("#wikipediasuggestions").empty();
		}
		$("#wikipediasuggestions").append($("<li></li>").text(x[0]));
	});
	
	/*
	Optimization:
	1. Stream.dom($('#<somevalue>'), "keyup").map(eventTargetValueFn) will be very common for input boxes and 
		hence can be optimized to Stream.domInputBoxValue(elementName); This optimization is implemented below for fire query.
		
	2. The pattern Stream.domInputBoxValue(elementName).throttle(<some duration>).search(<searchFn>) is common for search
		and hence can be replaced by Stream.throttledSearchFromInput(elementName, throttleDuration, searchFn)
		This is just another idea but is not implemented.
	*/
/*
	var fireSearchFunction = function() {
		$("#fireevents").empty();
		var searchTerm = fireSearchStream.lastValue;
		if (searchTerm == null) {
			searchTerm = "";
		}
		for (i of fireOutputStream.values)
		{
			if (i['3479077'].includes(searchTerm))
			{
				$("#fireevents").append($("<li></li>").text(i['3479077']));
			}
		}
	};
	
	var fireOutputStream = Stream.urlEveryMin(FIRE911URL).flatten().unique(function(x){return x['id'];});
	var fireSearchStream = Stream.domInputBoxValue($('#firesearch')).throttle(100);
	
	fireSearchStream.subscribe(function(x){
		fireSearchFunction();
	});
	
	fireOutputStream.subscribe(function(x){
		fireSearchFunction();
	});
	
	/*
	var uniqStream = Stream.urlEveryMin(FIRE911URL).flatten().unique(function(x){return x['id'];});
	uniqStream.subscribe(function(x){
		globalFireData.push(x);
	});
	uniqStream.searchFireData($('#firesearch'), "keyup").subscribe(function(x){
		$("#fireevents").empty();
		for (i of globalFireData)
		{
			if (i['3479077'].includes(x))
			{
				$("#fireevents").append($("<li></li>").text(i['3479077']));
			}
		}
	});

	*/
/*});
 */