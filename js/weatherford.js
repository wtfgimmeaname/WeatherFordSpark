window.WeatherFord || {}

window.WeatherFord = {
  location: "welcome",
  searchForm: $('form#location-search'),
  geo: new google.maps.Geocoder(),
  map: undefined,

  /*
   * Initialize weather app.
   * Call loadLocation without param to check for existing cookie
   * If none, return the welcome page.
   */
  init: function() {
    // Capture form submit and set location value
    this.searchForm.on('submit', function(evt) {
      evt.preventDefault();
      WeatherFord.setLocation($('#location', this).val());
    });

    if (this.getLocation()) { this.buildGeoLocation(); }
    else { this.showWelcome(); }
  },

  buildGeoLocation: function() {
    this.searchForm.find('input#location').val(this.location);
    this.geo.geocode({ 'address': WeatherFord.location }, function(res, stat) {
      if (stat === "OK") { WeatherFord.renderMap(res) }
    });
  },

  renderMap: function(data) {
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

      // Reset form, hide welcome screen, show loader
      this.searchForm.removeClass('error');
      if (this.location === "welcome") { this.hideWelcome(); }
      this.showLoader();

      // Set cookie and global value to new location
      $.cookie('location', param, { expires: 7, path: "/" });
      this.location = $.cookie('location')
      this.buildGeoLocation();

      return true;
    } else {
    // Simple form error
      this.searchForm.addClass('error').find('input[type="text"]')
          .val('Please enter a valid location');
    }
  },

  showLoader: function() { $('.loading').addClass('is') },
  hideLoader: function() { $('.loading').removeClass('is') },

  showWelcome: function() { this.location = "welcome" },
  hideWelcome: function() {
    if (this.location === "welcome") {
      header = $('body > header')
      header.animate({
        top: "-"+(header.height()+30)+"px"
      }, 200, function() {
        header.addClass('minimized').animate({ top: "0px" }, 200)
      });
    }
  }

}

$(function() { WeatherFord.init() });
