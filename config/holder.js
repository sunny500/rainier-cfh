/* eslint-disable */
angular.module('mean', ['ngCookies', 'ngResource', 'ui.bootstrap', 'ui.route', 'mean.system', 'mean.directives', 'firebase'])
.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
        when('/', {
        templateUrl: 'views/index.html'
      })
        .when('/app', {
        templateUrl: '/views/app.html',
      })
        .when('/privacy', {
        templateUrl: '/views/privacy.html',
      })
        .when('/bottom', {
        templateUrl: '/views/bottom.html',
      })
        .when('/signin', {
        templateUrl: '/views/signin.html',
        resolve: {
          auth: function (RedirectService) {
              return RedirectService.redirect();
            }
        },
      })
        .when('/signup', {
        templateUrl: '/views/signup.html',
        resolve: {
          auth: function (RedirectService) {
              return RedirectService.redirect();
            }
        },
      })
        .when('/password', {
        templateUrl: '/views/password.html',
        controller: 'PasswordController'
      })
        .when('/password/reset/:token', {
        templateUrl: '/views/reset.html',
        controller: 'PasswordController'
      })
        .when('/dashboard', {
        templateUrl: '/views/dashboard.html',
        controller: 'DashboardCtrl'
      })
        .when('/choose-avatar', {
        templateUrl: '/views/choose-avatar.html'
      })
        .when('/dashboard', {
        templateUrl: '/views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
          auth (AuthService) {
              return AuthService.authenticate();
            }
        }
      })
        .otherwise({
        redirectTo: '/'
      });
  }
]).config(['$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!');
  }
]).run(['$rootScope', function ($rootScope) {
  $rootScope.safeApply = function (fn) {
    let phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };
}])
.run(['DonationService', function (DonationService) {
  window.userDonationCb = function (donationObject) {
    DonationService.userDonated(donationObject);
  };
}])
.factory('AuthService', ($q, $window) => {
  return {
    authenticate: function () {
      const isAuthenticated = localStorage.getItem('cfhToken');
      if (isAuthenticated) {
        return true;
      } else {
        $window.location.href = '/#!/signin';
      }
      return $q.reject('Not Authenticated');
    }
  }
})
.factory('RedirectService', ($q, $window) => {
  return {
    redirect: () => {
      const isAuthenticated = localStorage.getItem('cfhToken');
      if (!isAuthenticated) {
        return true;
      } else {
        $window.location.href = '/#!/dashboard';
      }
      return $q.reject('Not Authenticated');
    }
  }
});

angular.module('mean.system', []);
angular.module('mean.directives', []);
