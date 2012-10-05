## WeatherFordSpark
My MockStartup for stripe. WeatherSpark.com is by far one of my favorite
web services out there right now. This is my *minimal clone* for
running a simple city search and displaying a google map of the area
and harnessing a weather api to show a 5 day forecast.

#### Design and technology decisions
The only complaint I have with WeatherSpark is that it is usually more data
than I really need. Usually I just want to see a nice map (I love maps) and
what to expect as far as temperatures go, conditions and wind. With this
in mind, I chose to ditch the very pretty flash graphs and go with a more
traditional 5 day forecast view.

Since everything is built in HTML5, CSS3, and Javascript, this minimal
clone can be ran without the needs of a server. It also triumps the actual
WeatherSpark in that it does not rely on the Flash plugin.


#### Scaling challenges
Challenges scaling up would start at the api level. Unfortunately for my
demo, World Weather Online, the free weather api I chose to use, does not
update data often on the services free tier. Please keep this in mind when
pulling up different cities.

To make a more sustained product, a cache would be necessary to save
user searches and make faster queries.

#### Taking it further
If this was to go further, I would like to see the following features.
- Local history of searches
- More up-to-date current weather
- Horizon chart of last 72 hours.
