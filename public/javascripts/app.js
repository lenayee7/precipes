
var app = angular
  .module('RecipeApp', ['ui.router', 'ngResource', 'satellizer', 'RecipeFactory'])
  .controller('MainController', MainController)
  .controller('HomeController', HomeController)
  .controller('LoginController', LoginController)
  .controller('SignupController', SignupController)
  .controller('LogoutController', LogoutController)
  .controller('ProfileController', ProfileController)
  .service('Account', Account)
  .config(configRoutes)
  ;

////////////
// ROUTES //
////////////

configRoutes.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider"]; // minification protection
function configRoutes($stateProvider, $urlRouterProvider, $locationProvider) {

  //this allows us to use routes without hash params!
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'templates/home.html',
      controller: 'HomeController',
      controllerAs: 'home'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'templates/signup.html',
      controller: 'SignupController',
      controllerAs: 'sc',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginController',
      controllerAs: 'lc',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('logout', {
      url: '/logout',
      template: null,
      controller: 'LogoutController',
      resolve: {
        loginRequired: loginRequired
      }
    })
    .state('profile', {
      url: '/profile',
      templateUrl: 'templates/profile.html',
      controller: 'ProfileController',
      controllerAs: 'profile',
      resolve: {
        loginRequired: loginRequired
      }
    })
    .state('newRecipe', {
      url: '/profile/recipes/new',
      templateUrl: 'templates/recipes/new-recipe.html',
      controller: 'RecipesCtrl',
      controllerAs: 'rec'
    })

    .state('allRecipes', {
     url: '/recipes',
     templateUrl: 'templates/recipes/recipe-index.html',
     controller: 'RecipesCtrl',
     controllerAs: 'rec'
    })

    .state('recipes', {
     url: '/profile/recipes',
     templateUrl: 'templates/recipes/recipe-box.html',
     controller: 'userRecipeCtrl',
     controllerAs: 'userrec'
    })

    .state('recipeshow', {
     url: '/profile/recipes/:recipeId',
     templateUrl: 'templates/recipes/recipe-show.html',
     controller: 'recipeShowCtrl',
     controllerAs: 'recshow'
    })
  

    function skipIfLoggedIn($q, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.reject();
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    function loginRequired($q, $location, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.resolve();
      } else {
        $location.path('/login');
      }
      return deferred.promise;
    }

}

/////////////////
// CONTROLLERS //
/////////////////

MainController.$inject = ["Account"]; // minification protection
function MainController (Account) {
  var vm = this;
  vm.currentUser = function() {
   return Account.currentUser();
  }
}

HomeController.$inject = ["$http"]; // minification protection
function HomeController ($http) {
  var vm = this;
  vm.posts = [];
  vm.new_post = {};

  $http.get('/api/posts')
    .then(function (response) {
      vm.posts = response.data;
    });

  vm.createPost = function() {
    $http.post('/api/posts', vm.new_post)
    .then(function (response) {
      vm.new_post = {};
      vm.posts.push(response.data);
    });
  };
  
  vm.deletePost = function(post) {
    $http.delete("/api/posts/" + post._id)
      .then(function(response) {
        var postIndex = vm.posts.indexOf(post);
        vm.posts.splice(postIndex, 1);
      });
  }
}


LoginController.$inject = ["Account", "$location"]; // minification protection
function LoginController (Account, $location) {
  var vm = this;
  vm.new_user = {}; // form data

  vm.login = function() {
    Account
      .login(vm.new_user)
      .then(function(){
         vm.new_user = {};
         $location.path('/profile/recipes');
      })
  };
}

SignupController.$inject = ["Account", "$location"]; // minification protection
function SignupController (Account, $location) {
  var widget = uploadcare.initialize('#profile-image');
  var vm = this;
  vm.new_user = {}; // form data


  vm.signup = function() {
    vm.new_user.profilePic = $('#profile-image').val();
    Account
      .signup(vm.new_user)
      .then(
        function (response) {
          vm.new_user = {};
          $location.path('/profile')
        }
      );
  };
}

LogoutController.$inject = ["Account", "$location"]; // minification protection
function LogoutController (Account, $location) {
  Account.logout(function() {
    $location.path('/login'); 
  });

}


ProfileController.$inject = ["Account"]; // minification protection
function ProfileController (Account) {
var widget = uploadcare.initialize('#edit-profile-image');

  var vm = this;
  vm.new_profile = {}; // form data

  vm.updateProfile = function() {
    vm.new_profile.profilePic = $('#edit-profile-image').val();
    Account
      .updateProfile(vm.new_profile)
      .then(function() {
    // On success, clear the form
        vm.showEditForm = false;
      });
  };

  vm.deleteProfile = function(currentUser) {
      console.log("Current user id", currentUser); 
    Account.remove({id: currentUser._id});
    var userIndex = vm.users.indexOf(user);
      console.log("user to delete ", user)
    vm.users.splice(userIndex,1);
  }
}

//////////////
// Services //
//////////////


Account.$inject = ["$http", "$q", "$auth", "$http"]; // minification protection
function Account($http, $q, $auth, $http) {
  var self = this;
  self.user = null;

  self.signup = signup;
  self.login = login;
  self.logout = logout;
  self.currentUser = currentUser;
  self.getProfile = getProfile;
  self.updateProfile = updateProfile;

 function signup(userData) {
    // returns a promise
    return (
      $auth
        .signup(userData)
        .then(
          function onSuccess(response) {
            $auth.setToken(response.data.token); 
              console.log('User Data', userData); 
          },

          function onError(error) {
            console.error(error);
          }
        )
    );
  }

  function login(userData) {
    return (
      $auth
        .login(userData) 
        .then(
          function onSuccess(response) {
            $auth.setToken(response.data.token);
          },

          function onError(error) {
            console.error(error);
          }
        )
    );
  }

  function logout(cb) {
    // returns a promise!!!
    $auth
      .logout()
      .then(function() {
          console.log("User Id before logout ", self.user); 
        self.user = null;
          console.log("User Id after logout ", self.user); 
          cb();
    });
  }

  function currentUser() {
    if ( self.user ) { return self.user; }
    if ( !$auth.isAuthenticated() ) { return null; }

    var deferred = $q.defer();
    getProfile().then(
      function onSuccess(response) {
        self.user = response.data;
        deferred.resolve(self.user);
      },

      function onError() {
        $auth.logout();
        self.user = null;
        deferred.reject();
      }
    )
    self.user = promise = deferred.promise;
    return promise;

  }

  function getProfile() {
    return $http.get('/api/profile');
  }

  function updateProfile(profileData) {
    return (
      $http
        .put('/api/profile', profileData)
        .then(
          function (response) {
            self.user = response.data;
          }
        )
    );
  }

}
