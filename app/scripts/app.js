'use strict';

/**
 * @ngdoc overview
 * @name placesWebApp
 * @description
 * # placesWebApp
 *
 * Main module of the application.
 */
angular
  .module('placesWebApp', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'leaflet-directive',
    'firebase'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/:mapID', {
        templateUrl: 'views/maps.html',
        controller: 'MapsCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
