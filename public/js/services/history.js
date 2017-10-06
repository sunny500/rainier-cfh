/* eslint-disable */
(() => {
  /**
  * angular
  * Description: Angular
  */
  angular.module('mean.system')
  /**
  * history services
  * Description: setup a history service
  */
  .factory('history', ['$http',
    ($http) => {
      const history = {};
      // method that saves a user game data
      history.saveGameHistory = (route, gameSession) => {
        return $http({
          method: 'POST',
          url: route,
          headers: { 'Content-Type': 'application/json' },
          data: {
            gameOwner: gameSession.gameOwner,
            gamePlayers: gameSession.gamePlayers
          }
        }).then((response) => {
          return response.data;
        });
      };
      // method that updates a user game data
      history.updateGameHistory = (route, gameSession) =>
        $http({
          method: 'POST',
          url: route,
          headers: { 'Content-Type': 'application/json' },
          data: {
            gameSessionId: gameSession.gameKey,
            gameWinner: gameSession.gameWinner,
            status: gameSession.status,
            gameRounds: gameSession.gameRounds
          }
        }).then(response => response.data);

      return history;
    }
  ]);
})();
