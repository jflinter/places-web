'use strict';

/**
 * @ngdoc function
 * @name placesWebApp.controller:MapsCtrl
 * @description
 * # MapsCtrl
 * Controller of the placesWebApp
 */
angular.module('placesWebApp')
  .controller('MapsCtrl', function ($scope, $firebase, $routeParams, leafletData, leafletEvents) {
    var markerCache = {};
    $scope.title = "Loading...";
    $scope.markers = [];
    // leafletData.getMap().then(function(map) {
    //   var lc = L.control.locate({
    //     follow: false,
    //     setView: false,
    //     markerStyle: {
    //       clickable: false,
    //       pointerEvents: 'none',
    //       className: 'locate-circle'
    //     },
    //     locateOptions: {
    //       watch: false
    //     }
    //   }).addTo(map);
    //   lc.locate();
    // });
    $scope.$on('leafletDirectiveMap.popupopen', function(event, args){
      var html = args.leafletEvent.popup._container;
      $(html).addClass("animated-popup");
      leafletData.getMap().then(function(map) {
        var popup = args.leafletEvent.popup;
        var placeId = $(popup._content).data('placeid');
        var photoRef = new Firebase("https://shareplaces.firebaseio.com/photos/" + placeId);
        photoRef.once('value', function(photoSnap) {
          var imageData = _.map(photoSnap.val(), function(photo) {return photo.image})[0];
          if (imageData) {
            var marker = markerCache[placeId];
            if (!marker.photoLoaded) {
              marker.message += "<img class='places-image' src='data:image/png;base64," + imageData + "' />";
              marker.photoLoaded = true;
              $scope.$apply();
            }
          }
        });
        var zoom = map.getZoom();
        var latlng = popup._latlng;
        // var popupHeight = $(popup._container).height() + 10;
        // var diff = popupHeight - ($(window).height() / 2 - 100);
        var diff = 70;
        // if (diff > 0) {
          var targetPoint = map.project(latlng, zoom).subtract([0, diff]);
          latlng = map.unproject(targetPoint, zoom);
        // }
        $scope.center = {lat: latlng.lat, lng: latlng.lng, zoom: zoom};
      });
      
    });
    $scope.$on('leafletDirectiveMap.popupclose', function(event, args){
      var html = args.leafletEvent.popup._container;
      $(html).removeClass("animated-popup");
    });
    $scope.$on('leafletDirectiveMap.dragstart', function(event, args){
      leafletData.getMap().then(function(map) {
        map.fire('preclick');
      });
    });
    var mapRef = new Firebase("https://shareplaces.firebaseio.com/maps/" + $routeParams.mapID);
    mapRef.once('value', function(snapshot){
      var places = _.filter(_.map(snapshot.val().places, function(place, placeId) {
        place.id = placeId;
        return place;
      }), function(place) {
        return !place.PLCDeletedAt;
      });
      var markers = _.map(places, function(place) {
        var firstLine, rest = "";
        if (place.caption) {
          var lines = place.caption.split("\n");
          firstLine = lines[0];
          rest = lines.splice(1).join("<br>");
        }
        var content = "<div class='marker-content' data-placeid='" + place.id + "'>" +
        "<div class='marker-title'>" +
        firstLine +
        "</div>" +
        rest +
        "</div>";
        var marker = {
          lat: place.latitude,
          lng: place.longitude,
          message: content,
          icon: {
            iconUrl: isRetinaDisplay() ? "images/pin@2x.png" : "images/pin.png",
            iconSize: [28, 72],
            iconAnchor: [14, 54],
            shadowSize: [0, 0],
            shadowUrl: "images/shadow.png"
          },
          popupOptions: {
            closeButton: false,
            autoPan: false,
            minWidth: 200,
            maxWidth: 200,
          }
        };
        markerCache[place.id] = marker;
        return marker;
      });
      var markerBounds = {
        northEast: {
          lat: _.max(_.map(places, 'latitude')),
          lng: _.max(_.map(places, 'longitude'))
        },
        southWest: {
          lat: _.min(_.map(places, 'latitude')),
          lng: _.min(_.map(places, 'longitude'))
        }
      };
      angular.extend($scope, {
        title: snapshot.val().name,
        markers: markers,
        bounds: markerBounds,
        maxBounds: markerBounds,
      });
      $scope.$apply();
    });
    var tileFormatSuffix = isRetinaDisplay() ? "@2x.png" : ".png";
    var tileLayer = "https://a.tiles.mapbox.com/v3/jflinter.icfgg4f5/{z}/{x}/{y}" + tileFormatSuffix;
    angular.extend($scope, {
        defaults: {
            tileLayer: tileLayer,
            tileLayerOptions: {
              detectRetina: true
            }
        },
        center: { lat: 1, lng: 1, zoom: 1 },
        bounds: {
          northEast: {
            lat: 50.0077390146369,
            lng: -55.8984375
          },
          southWest: {
            lat: 22.836945920943855,
            lng: -138.25195312499997
          }
        }
    });
  });

function isRetinaDisplay() {
  var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5), (min--moz-device-pixel-ratio: 1.5), " +
    "(-o-min-device-pixel-ratio: 3/2), (min-resolution: 1.5dppx)";
  if (window.devicePixelRatio > 1) {
    return true;
  }
  return (window.matchMedia && window.matchMedia(mediaQuery).matches);
};
