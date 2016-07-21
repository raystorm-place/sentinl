import _ from 'lodash';
import moment from 'moment';
import chrome from 'ui/chrome';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';
import $ from 'jquery';

/* Timepicker */
import 'ui/timepicker';
import 'ui/courier';
import 'ui/filter_bar';

// import TableVisTypeProvider from 'ui/template_vis_type/TemplateVisType';
// import VisSchemasProvider from 'ui/vis/schemas';
// import tableVisTemplate from 'plugins/table_vis/table_vis.html';
// require('ui/registry/vis_types').register(TableVisTypeProvider);

import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';
// import tableSpyModeTemplate from 'plugins/spy_modes/table_spy_mode.html';

import Notifier from 'ui/notify/notifier';
// import 'ui/autoload/styles';

/* Custom Template + CSS */
import './less/main.less';
import template from './templates/index.html';
import about from './templates/about.html';
import alarms from './templates/alarms.html';

var impactLogo = require('plugins/kaae/kaae.svg');

console.log('DEBUG APP START');

chrome
  .setBrand({
    'logo': 'url(' + impactLogo + ') left no-repeat',
    'smallLogo': 'url(' + impactLogo + ') left no-repeat',
    'title': 'Kaae'
  })
  .setNavBackground('#222222')
  .setTabs([]);

uiRoutes.enable();

uiRoutes
.when('/', {
  template,
  resolve: {
    currentTime($http) {
      return $http.get('../api/kaae/example').then(function (resp) {
        return resp.data.time;
      });
    },
    currentWatchers($http) {
      return $http.get('../api/kaae/list').then(function (resp) {
	console.log('DEBUG LIST:',resp);
        return resp;
      });
    },
    currentAlarms($http) {
      return $http.get('../api/kaae/alarms').then(function (resp) {
	console.log('DEBUG ALARMS:',resp);
        return resp;
      });
    }
  }
});

uiRoutes
.when('/alarms', {
  template: alarms,
  resolve: {
    currentTime($http) {
      return $http.get('../api/kaae/example').then(function (resp) {
        return resp.data.time;
      });
    },
    currentWatchers($http) {
      return $http.get('../api/kaae/list').then(function (resp) {
	console.log('DEBUG LIST:',resp);
        return resp;
      });
    },
    currentAlarms($http) {
      return $http.get('../api/kaae/alarms').then(function (resp) {
	console.log('DEBUG ALARMS:',resp);
        return resp;
      });
    }
  }
});

uiRoutes
.when('/about', {
  template: about
});

uiModules
.get('api/kaae', [])
.controller('kaaeHelloWorld', function ($rootScope, $scope, $route, $interval, $timeout, timefilter, Private, Notifier, $window, kbnUrl) {
  $scope.title = 'Kaae';
  $scope.description = 'Kibana Alert App for Elasticsearch';
  // $scope.store = window.sessionStorage;

  $scope.topNavMenu = [{
    key: 'new',
    description: 'HOME',
    run: function () { kbnUrl.change('/'); }
  }];

  timefilter.enabled = true;
  /*
	time: {
	        gt: timefilter.getBounds().min.valueOf(),
	        lte: timefilter.getBounds().max.valueOf()
	      }
  */

  // kbnUrl.change('/', {});

  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
  if ($route.current.locals.currentWatchers.data.hits.hits) {
	   $scope.watchers = $route.current.locals.currentWatchers.data.hits.hits;

	/*
	   $scope.spy.params.spyPerPage = 10;
	   $scope.table = tabifyAggResponse($scope.vis, $route.current.locals.currentWatchers.data.hits.hits, {
             canSplit: false,
             asAggConfigResults: true,
             partialRows: true
           });
	*/

  } else { $scope.watchers = []; }

  var checkAlarm = function() {
	  if ($route.current.locals.currentAlarms.data) {
		   $scope.currentAlarms = $route.current.locals.currentAlarms.data.data;
	  } else { $scope.currentAlarms = [] }
  }

  $scope.currentRefresh = 0;
  $scope.newRefresh = 0;

  checkAlarm();

  /* Reschedule updates */
  var updateRefresh = function(refreshValue) {
     if (refreshValue != $scope.currentRefresh && refreshValue != 0){
	  console.log('NEW REFRESH:',refreshValue);
	  $scope.currentRefresh = refreshValue;
  	  $interval.cancel($scope.refreshalarms);
	  $scope.refreshalarms = $timeout(function () {
	     console.log('Reloading data....');
	     $route.reload();
          }, refreshValue);
     }
  }

  /* Listen for refreshInterval changes */
    $rootScope.$watchCollection('timefilter.refreshInterval', function () {
      let refreshValue = _.get($rootScope, 'timefilter.refreshInterval.value');
      let refreshPause = _.get($rootScope, 'timefilter.refreshInterval.pause');
      if (_.isNumber(refreshValue) && !refreshPause) {
	    $scope.newRefresh = refreshValue;
	    updateRefresh(refreshValue);
      } else {
	  console.log('NO REFRESH');
  	  $scope.currentRefresh = 0;
	  $interval.cancel($scope.refreshalarms);
      }
    });


  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

});

uiModules
.get('api/kaae', [])
.controller('kaaeAbout', function ($scope, $route, $interval, timefilter, Notifier) {
  $scope.title = 'Kaae';
  $scope.description = 'Kibana Alert App for Elasticsearch';
  timefilter.enabled = false;

  if (!$scope.notified) {
	  $scope.notify = new Notifier();
	  $scope.notify.warning('KAAE is a work in progress! Use at your own risk!');
	  $scope.notified = true;
  }

  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

});

