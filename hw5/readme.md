ReadMe File For HW5

Design Rationale:
For this assignment, I have implemented an Airline On Time Data Analysis Tool using D3 and Reactive Libraries. This is modelled based on the Crossfilter Example at http://square.github.io/crossfilter/.
The tool allows us to move sliders along the charts to filter data and thereby shows nice visualization transitions by which the user can understand how various data are correlated. It realizes the power of visualization by giving the ability to the user to get answers for various questions by just some UI actions. 
The slider movements generate events on every chart which are then sent upstream to the main stream through reactive libraries which triggers the refresh of all elements on the page. 

Narrated ScreenCast:
You can find the screencast in the file HW5_Demo in this folder.

Code Structure:
hw5.html is the main file which contains majority of the code.
rx.js contains the implementations of the reactive libraries that will be used by hw5.html. This is a stripped down version of the code that I had submitted for HW4.
flights-3m.json contains the input data set.
The folder also contains other supporting libraries like d3, jquery, underscore.

Instructions to run:
1. Start python httpServer from the HW5 directory by running "python -m http.server 8888"
2. Open Chrome and navigate to "http://localhost:8888/hw5.html"
3. Filter any ranges on any charts and see how other charts, total flight count and bottom table data changes.

