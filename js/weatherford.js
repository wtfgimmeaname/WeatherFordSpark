window.WeatherFord || {}

window.WeatherFord = {
  location: "welcome",
  searchForm: $('form#location-search'),

  // Google global properties
  geo: new google.maps.Geocoder(),
  map: undefined,

  // WWO global properties
  wwoUrl:  "http://free.worldweatheronline.com/feed/weather.ashx",
  wwoData: {
    key:  "059fda09a6175615120310",
    format: "json",
    num_of_days: "5"
  },

  // Initialize weather app.
  init: function() {
    // Setup global event listeners
    this.searchForm.on('submit', function(evt) {
      evt.preventDefault();
      WeatherFord.setLocation($('#location', this).val());
      WeatherFord.buildWeatherFordSpark();
    });

    $('.current-cookie a').on('click', function(evt) {
      evt.preventDefault();
      if (WeatherFord.unsetLocation()) { WeatherFord.showWelcome(); }
    });

    if (this.getLocation()) { this.buildWeatherFordSpark(); }
  },

  // Build entire location page.
  buildWeatherFordSpark: function() {
    this.searchForm.find('input#location').val(this.location);

    // Show google map.
    WeatherFord.geo.geocode( { 'address': WeatherFord.location },
      function(res, stat) {
        if (stat === "OK") {
          var t = setTimeout(function() {
            WeatherFord.gMapRender(res);
            clearTimeout(t);
          }, 500);
        }
      }
    );

    //this.weatherHUD(); // Build weather data from WWO
  },

  // Render or build a google map
  gMapRender: function(data) {
    $('#map-canvas').fadeIn(200);
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
    $('#map-canvas').css('height', ($(document).height() - 35)+"px");
  },

  weatherHUD: function() {
    this.wwoData['q'] = encodeURIComponent(this.location);

    //$.ajax({
    //  url: this.wwoUrl, dataType: "jsonp", data: this.wwoData,
    //  success: function(data) { console.log(data); },
    //  error: function(data) { console.log("Error: " + data); }
    //});
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
    $('#map-canvas, #weather-graph').fadeOut(200);
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
