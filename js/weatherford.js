/* Global tools */
window.weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
window.currentReadableTime = function() { // Return readable time format - 8:45 AM
  dNow  = new Date();
  minutes  = dNow.getMinutes();
  meridian = (dNow.getHours() > 11) ? "PM" : "AM";
  readableHour = (dNow.getHours() > 12) ? dNow.getHours() - 12 : dNow.getHours();
  readableMins = (minutes < 10) ? "0" + minutes : minutes;
  return readableHour + ":" + readableMins + " " + meridian;
}
// Returns true if it's currently nighttime. This way we can show the moon in the "current weather" area.
window.isNighttime = function() {
  dte = new Date();
  if (dte.getHours() < 5 || dte.getHours() > 18) { return true; }
  else { return false; }
}

// Register global objects on the window.
window.WeatherFord        || {}
window.WorldWeatherOnline || {}

/* World weather online
 * This api is used for getting the 5 day
 * forecast data and yesterdays data.
 */
window.WorldWeatherOnline = {
  url:  "http://free.worldweatheronline.com/feed/weather.ashx",
  data: { key: "059fda09a6175615120310", format: "json" },

  /* WWO Weather codes
   * WWO uses a really poor naming system for describing current
   * weather conditions. We use their defaults for display but map
   * numerous different conditions to the same visual icons for example:
   * "Patchy Rain Nearby", "Patchy light drizzle", "Light Drizzle" are
   * all possible condition codes that can show the "light-rain" icon.
   */
  weatherClasses: ["clear-sunny", "partly-cloudy", "cloudy", "overcast",
                   "fog", "freezing-fog", "light-rain", "heavy-rain",
                   "light-rain-thunder", "heavy-rain-thunder", "light-snow",
                   "moderate-snow", "heavy-snow"
                  ],
  weatherCodes: {
    113: 0, 116: 1, 119: 2, 122: 3, 143: 3, 248: 4, 182: 5, 185: 5, 260: 5,
    281: 5, 284: 5, 311: 5, 317: 5, 350: 5, 374: 5, 176: 6, 263: 6, 266: 6,
    293: 6, 296: 6, 299: 6, 353: 6, 362: 6, 302: 7, 305: 7, 308: 7, 314: 7,
    320: 7, 356: 7, 359: 7, 365: 7, 377: 7, 200: 8, 386: 8, 389: 9, 179: 10,
    323: 10, 326: 10, 368: 10, 392: 10, 227: 11, 329: 11, 332: 11, 395: 11,
    230: 12, 335: 12, 338: 12, 371: 12
  },

  // Lookup html class from code
  getClassFromCode: function(code) {
    classIndex = this.weatherCodes[code];
    return this.weatherClasses[classIndex];
  },

  // WWO query for specific date requires format YYYY-MM-DD
  formatQueryableDate: function(offsetFromToday) {
    reqDate = new Date();
    reqDate.setDate(reqDate.getDate() + offsetFromToday)

    year   = reqDate.getFullYear();
    month  = ((reqDate.getMonth()+1) < 10) ? "0"+(reqDate.getMonth()+1) : reqDate.getMonth()+1;
    day    = (reqDate.getDate() < 10) ? "0"+reqDate.getDate() : reqDate.getDate();

    return year+"-"+month+"-"+day;
  },

  /*
   * Execute ajax paths for retrieving all data and formatting
   */
  weatherJSON: function(address, func) {
    this.fiveDayForecastJSON(address, this.yesterdaysJSON, func);
    return true;
  },

  // Build, and send 5 day forecast to yesterday function
  fiveDayForecastJSON: function(address, nextFunc, finalFunc) {
    fiveDayData      = this.data;
    fiveDayData['q'] = encodeURIComponent(address);
    fiveDayData['num_of_days'] = '5';
    xhrData = {};

    $.ajax({
      url: this.url, dataType: "jsonp", data: fiveDayData, async: false,
      success: function(data) {
        delete WorldWeatherOnline.data['num_of_days'];
        nextFunc(address, data, finalFunc);
      },
      error: function(data)   { alert("Error retrieving the 5 day forecast."); }
    });
  },

  // Build, send, and return data on yesterdays weather.
  yesterdaysJSON: function(address, fiveDayData, finalFunc) {
    _this = WorldWeatherOnline;
    yesterdayData = _this.data;
    yesterdayData['date'] = _this.formatQueryableDate(-1);

    $.ajax({
      url: _this.url, dataType: "jsonp", data: yesterdayData, async: false,
      success: function(data) {
        delete _this.data['date'];
        _this.cleanData(fiveDayData, data, finalFunc);
      },
      error: function(data)   { alert("Error retrieving yesterdays data."); }
    });
  },

  cleanData: function(fiveDayData, yesterdaysData, finalFunc) {
    cleanedData = {}
    cleanedData['weathers'] = fiveDayData['data']['weather'];
    cleanedData['weathers'].unshift(yesterdaysData['data']['weather'][0]);
    cleanedData['current_condition'] = fiveDayData['data']['current_condition'][0];
    finalFunc(cleanedData);
  }
}

/* WeatherFordSpark app */
window.WeatherFord = {
  location: "welcome",
  searchForm: $('form#location-search'),

  // Google maps stuff
  geo: new google.maps.Geocoder(),
  map: undefined,

  // Initialize weather app.
  init: function() {
    // Setup global event listeners
    this.searchForm.on('submit', function(evt) {
      evt.preventDefault();
      WeatherFord.setLocation($('#location', this).val());
      WeatherFord.showWeatherFordSpark();
    });

    $('.current-cookie a').on('click', function(evt) {
      evt.preventDefault();
      if (WeatherFord.unsetLocation()) { WeatherFord.showWelcome(); }
    });

    if (this.getLocation()) { this.showWeatherFordSpark(); }
  },

  // Build entire location page.
  showWeatherFordSpark: function() {
    this.searchForm.find('input#location').val(this.location);

    /* Google maps address parse
     * Build weatherForecast with google data too. Google geo is most likely to
     * return something even from random input.
     */
    WeatherFord.geo.geocode({ 'address': WeatherFord.location },
      function(res, stat) {
        if (stat === "OK") {
          var t = setTimeout(function() {
            $('#weather-data').fadeIn(200);
            WeatherFord.gMapRender(res);
            WeatherFord.fetchForecastData(res[0]['formatted_address'])
            clearTimeout(t);
          }, 500);
        }
      }
    );
  },

  // This makes ajax calls to wwo and on success builds the weather forcast
  fetchForecastData: function(geoAddress) {
    WorldWeatherOnline.weatherJSON(geoAddress, WeatherFord.weatherForecast)
  },

  // This is called by the WWO ajax call
  weatherForecast: function(data) {
    // Build current weather data
    WeatherFord.currentWeatherHUD(data['current_condition']);

    boxParent   = $('#weather-hud');
    forecastBox = boxParent.find('> div').detach();
    dayHTML     = $("article.clone", forecastBox);

    // Reset and build forecast
    forecastBox.find('article:not(.clone)').remove();
    _.each(data['weathers'], function(day, idx) {
      aday = dayHTML.clone().removeClass('clone');

      // Set date title
      if (idx === 0) { aday.find('header h3').text('Yesterday'); }
      else if (idx === 1) {
        forecastBox.append(aday.clone().empty().addClass('today-padder'));
        aday.addClass('today').find('header h3').text('Today');
      }
      else {
        dte = new Date(day['date'].replace(/(\d{4})-(\d{2})-(\d{2})/,"$2/$3/$1"));
        aday.find('header h3').text(weekdays[dte.getDay()]);
      }

      // Make weather description strings
      weatherStr = day['weatherDesc'][0]['value'];
      weatherCls = WorldWeatherOnline.getClassFromCode(day['weatherCode']);

      // Set weather body data
      aday.find('section p.icon').text(weatherStr).addClass(weatherCls)
          .siblings('.weather').text(weatherStr)
          .siblings('.winds').text("Winds at "+day['windspeedMiles']+"mph")
          .siblings('.temp-high').find('span').html(day['tempMaxF']+"&#8457;")
          .closest('.temp-high').siblings('.temp-low')
          .find('span').html(day['tempMinF']+"&#8457;");

      forecastBox.append(aday);
    });

    boxParent.append(forecastBox).fadeIn(200);
  },

  // Build current weather display
  currentWeatherHUD: function(data) {
    // Build data vars
    icon = WorldWeatherOnline.getClassFromCode(data['weatherCode']);
    temp = data['temp_F'] + "&#8457;";
    wthr = data['weatherDesc'][0]['value'];
    time = "Updated at: " + data['observation_time'] + ", now " + currentReadableTime();

    iconHTML = $('#current').find('.location').text("in "+this.location)
                            .siblings('.weather').text(wthr)
                            .siblings('.temp').html(temp)
                            .siblings('.time').text(time)
                            .siblings('.icon').addClass(icon)

    if (isNighttime()) { iconHTML.addClass('night'); }
  },

  // Render or build a google map
  gMapRender: function(data) {
    if (this.map) { this.map.setCenter(data[0].geometry.location); }
    else {
      // Build new map, make it resizable, and set weather layers
      var mapDefaults = {
        zoom: 9, mapTypeId: google.maps.MapTypeId.TERRAIN,
        center: data[0].geometry.location
      }
      this.map = new google.maps.Map($('#map-canvas')[0], mapDefaults);

      $(window).resize(function() {
        $("#map-canvas").css({ height: ($(document).height() - 35)+"px", });
      });

      var weatherLayer = new google.maps.weather.WeatherLayer({
        temperatureUnits: google.maps.weather.TemperatureUnit.FAHRENHEIT
      });
      weatherLayer.setMap(this.map);

      // TODO: Add toggle for cloud layer
      var cloudLayer = new google.maps.weather.CloudLayer();
      cloudLayer.setMap(this.map);
    }
    $('#map-canvas').fadeIn(200).css('height', ($(document).height() - 35)+"px");
  },

  // Check for a location
  getLocation: function() {
    if ($.cookie('location')) {
      this.hideWelcome();
      this.location = $.cookie('location');
      return $.cookie('location');
    }
    else { return false; }
  },

  // Set a new location
  setLocation: function(param) {
    // Simple form validation
    if (param && typeof(param) === "string" &&
        param !== "Please enter a valid location") {

      // Reset form, hide welcome screen
      this.searchForm.removeClass('error');
      if (this.location === "welcome") { this.hideWelcome(); }

      // Set cookie and global value to new location
      $.cookie('location', param, { expires: 7, path: "/" });
      this.location = $.cookie('location')

      return true;
    } else {
    // Simple form error
      this.searchForm.addClass('error').find('input[type="text"]')
          .val('Please enter a valid location');
    }
  },

  // Unset current location
  unsetLocation: function() {
    $.removeCookie('location', { expires: 7, path: "/" });
    if (!$.cookie('location')) { return true; }
    else { return false; }
  },

  // Show welcome screen - No location cookie set
  showWelcome: function() {
    this.location = "welcome"
    // Hide and remove old data and show big header
    $('#weather-data').fadeOut(200);
    header = $('body > header');
    header.animate({ top: "-240px" }, 200, function() {
      header.removeClass('minimized').animate({ top: "0px" }, 200)
            .find('.current-cookie').hide();
    });
  },

  // Location set/found - Cookie exists or search made
  hideWelcome: function() {
    if (this.location === "welcome") {
      header = $('body > header');
      header.animate({ top: "-240px" }, 200, function() {
        header.addClass('minimized').animate({ top: "0px" }, 200)
              .find('.current-cookie').show()
              .find('p').text(WeatherFord.location);
      });
    }
  }
}

$(function() { WeatherFord.init() });
