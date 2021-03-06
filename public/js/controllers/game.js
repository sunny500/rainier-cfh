/* eslint-disable */
angular.module('mean.system')
  .controller('GameController', ['$scope', 'socket', '$http', 'game', '$timeout', '$location', 'MakeAWishFactsService', '$dialog',
    function ($scope, socket, $http, game, $timeout, $location, MakeAWishFactsService, $dialog) {

      $scope.messageSender = '';
      $scope.checked = false;
      $scope.messagebody = '';
      $scope.searchText = '';
      $scope.messages = [];
      $scope.inviteEmailBody = `Your friend has requested you to play Card for Humanity together please
                                follow the link to play`;
      $scope.showMsgBody = true;
      $scope.searchedUsers = [];
      $scope.inviteUsers = [];
      $scope.sentEmailMessage = false;
      $scope.searchError = false;
      $scope.hasPickedCards = false;
      $scope.winningCardPicked = false;
      $scope.showTable = false;
      $scope.modalShown = false;
      $scope.game = game;
      $scope.pickedCards = [];
      let makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
      $scope.makeAWishFact = makeAWishFacts.pop();
      $scope.pickCard = function (card) {
        if (!$scope.hasPickedCards) {
          if ($scope.pickedCards.indexOf(card.id) < 0) {
            $scope.pickedCards.push(card.id);
            if (game.curQuestion.numAnswers === 1) {
              $scope.sendPickedCards();
              $scope.hasPickedCards = true;
            } else if (game.curQuestion.numAnswers === 2 &&
              $scope.pickedCards.length === 2) {
              // delay and send
              $scope.hasPickedCards = true;
              $timeout($scope.sendPickedCards, 300);
            }
          } else {
            $scope.pickedCards.pop();
          }
        }
      };

      socket.on('loadChat', (messages) => {
        $scope.chatLoading = false;
        $scope.messages = messages;
        $scope.scrollNow();
      });

      socket.on('add message', (message) => {
        $scope.messages.push(message);
        $scope.scrollNow();
      });


      $scope.pointerCursorStyle = function () {
        if ($scope.isCzar() && $scope.game.state === 'waiting for czar to decide') {
          return { cursor: 'pointer' };
        }
        return {};
      };

      $scope.sendPickedCards = function () {
        game.pickCards($scope.pickedCards);
        $scope.showTable = true;
      };

      $scope.cardIsFirstSelected = function (card) {
        if (game.curQuestion.numAnswers > 1) {
          return card === $scope.pickedCards[0];
        }
        return false;
      };

      $scope.cardIsSecondSelected = function (card) {
        if (game.curQuestion.numAnswers > 1) {
          return card === $scope.pickedCards[1];
        }
        return false;
      };

      $scope.firstAnswer = function ($index) {
        if ($index % 2 === 0 && game.curQuestion.numAnswers > 1) {
          return true;
        }
        return false;
      };

      $scope.secondAnswer = function ($index) {
        if ($index % 2 === 1 && game.curQuestion.numAnswers > 1) {
          return true;
        }
        return false;
      };

      $scope.showFirst = function (card) {
        return game.curQuestion.numAnswers > 1 && $scope.pickedCards[0] === card.id;
      };

      $scope.showSecond = function (card) {
        return game.curQuestion.numAnswers > 1 && $scope.pickedCards[1] === card.id;
      };

      $scope.isCzar = function () {
        return game.czar === game.playerIndex;
      };

      $scope.isPlayer = function ($index) {
        return $index === game.playerIndex;
      };

      $scope.isCustomGame = function () {
        return !(/^\d+$/).test(game.gameID) && game.state === 'awaiting players';
      };

      $scope.isPremium = function ($index) {
        return game.players[$index].premium;
      };

      $scope.currentCzar = function ($index) {
        return $index === game.czar;
      };

      $scope.winningColor = function ($index) {
        if (game.winningCardPlayer !== -1 && $index === game.winningCard) {
          return $scope.colors[game.players[game.winningCardPlayer].color];
        }
        return '#f9f9f9';
      };

      $scope.pickWinning = function (winningSet) {
        if ($scope.isCzar()) {
          game.pickWinning(winningSet.card[0]);
          $scope.winningCardPicked = true;
        }
      };

      $scope.winnerPicked = function () {
        return game.winningCard !== -1;
      };

      $scope.customGameOwner = function () {
        if (game.players[0] === undefined) {
          return false;
        }
        if (window.user === null) {
          return false;
        }
        return game.players[0].id === window.user._id;
      }

      // search users to invite
      $scope.searchInviteUsers = () => {
        $scope.sentEmailInvite = false;
        $http.post('/api/search/users', { query: $scope.searchText })
          .then((response) => {
            $scope.searchedUsers = response.data;
          });
      };

      // add users to invite list
      $scope.addUserInvite = (name, email) => {
        const user = {
          name,
          email
        };
        if ($scope.containsUser(user)) {
          const index = $scope.inviteUsers.indexOf(user);
          $scope.inviteUsers.splice(index, 1);
        } else {
          $scope.inviteUsers.push(user);
        }

        console.log($scope.inviteUsers);
      };

      // helper method to check if a user is already invited
      $scope.containsUser = (user) => {
        let i;
        for (i = 0; i < $scope.inviteUsers.length; i++) {
          if ($scope.inviteUsers[i].name === user.name) {
            return true;
          }
        }

        return false;
      };
      // send invite to users//
      $scope.sendInvite = () => {
        const gameLink = document.URL;
        const usersEmail = $scope.inviteUsers.map(user => user.email);
        const message = `${$scope.inviteEmailBody} ${gameLink} `;

        // backend http request to send emails to invited users
        $http.post('/api/invite/send', { emails: usersEmail, message })
          .then(() => {
            $scope.sentEmailInvite = true;
          });
        // garbage collection
        $scope.searchText = '';
        $scope.searchedUsers = [];
        $scope.inviteUsers = [];
      };
      // gets and return properties of the chat box
      $scope.getChatBoxLength = () => {
        const chatBox = $('#chat-content');
        // const newMessage = chatBox.children('li:last-child');
        const scrollTop = chatBox.prop('scrollTop');
        const scrollHeight = chatBox.prop('scrollHeight');


        return {
          chatBox,
          scrollTop,
          scrollHeight,
        };
      };
      //autoscroll to chat box bottom
      $scope.scrollNow = () => {
        setTimeout(() => {
          const { chatBox, scrollHeight } = $scope.getChatBoxLength();
          chatBox.scrollTop(scrollHeight);
        }, 300);
      };

      // toggles the chat box
      $scope.toggleMessage = () => {
        if ($scope.showMsgBody == true) {
          $scope.showMsgBody = false;
        } else if ($scope.showMsgBody == false) {
          $scope.showMsgBody = true;
        }
      };

      $scope.sendMessage = (message) => {
        $scope.sender = game.players[game.playerIndex];

        const newMessage = {
          sender: $scope.sender.username,
          body: message,
          avatar: $scope.sender.avatar,
          game: game.gameID,
          timeSent: new Date(Date.now()).toLocaleTimeString({
            hour12: true
          })
        };

        $scope.messages.push(newMessage);
        $scope.scrollNow();
        socket.emit('new message', newMessage);
      };

      $scope.checkUserIsInvited = (email) => $scope.inviteUsers.includes(email);

      $scope.startGame = () => {
        const popupModal = $('#popUpModal');
        if (game.players.length < game.playerMinLimit) {
          swal('You need a minimum of 3 players to start');
        } else {
          game.startGame();
        }
      };

      $scope.abandonGame = function () {
        game.leaveGame();
        if (localStorage.getItem('cfhUser') || localStorage.getItem('cfhUser')) {
          $location.path('/dashboard');
        } else {
          $location.path('/');
        }
      };


      // Catches changes to round to update when no players pick card
      // (because game.state remains the same)
      $scope.$watch('game.round', () => {
        $scope.hasPickedCards = false;
        $scope.showTable = false;
        $scope.winningCardPicked = false;
        $scope.makeAWishFact = makeAWishFacts.pop();
        if (!makeAWishFacts.length) {
          makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
        }
        $scope.pickedCards = [];
      });

      // In case player doesn't pick a card in time, show the table
      $scope.$watch('game.state', () => {
        if (game.state === 'waiting for czar to decide' && $scope.showTable === false) {
          $scope.showTable = true;
        }
        if ($scope.isCzar() && game.state === 'czar pick card' && game.table.length === 0) {
          $('#czarModal').modal({
            dismissible: false
          });
          $('#czarModal').modal('open');
        }
        if (game.state === 'game dissolved') {
          $('#czarModal').modal('close');
        }
        if ($scope.isCzar() === false && game.state === 'czar pick card'
          && game.state !== 'game dissolved'
          && game.state !== 'awaiting players' && game.table.length === 0) {
          $scope.czarHasDrawn = 'Wait! Czar is drawing Card';
        }
        if (game.state !== 'czar pick card'
          && game.state !== 'awaiting players'
          && game.state !== 'game dissolve') {
          $scope.czarHasDrawn = '';
        }
      });

      $scope.$watch('game.gameID', () => {
        if (game.gameID && game.state === 'awaiting players') {
          if (!$scope.isCustomGame() && $location.search().game) {
            // If the player didn't successfully enter the request room,
            // reset the URL so they don't think they're in the requested room.
            $location.search({});
          } else if ($scope.isCustomGame() && !$location.search().game) {
            // Once the game ID is set, update the URL if this is a game with friends,
            // where the link is meant to be shared.
            $location.search({ game: game.gameID });
            if (!$scope.modalShown) {
              setTimeout(() => {
                const link = document.URL;
                const txt = 'Give the following link to your friends so they can join your game: ';
                $('#lobby-how-to-play').text(txt);
                $('#oh-el').css({
                  'text-align': 'center', 'font-size': '22px', background: 'white', color: 'black'
                }).text(link);
              }, 200);
              $scope.modalShown = true;
            }
          }
        }
      });

      $scope.introJs = introJs();

      $scope.IntroOptions = {
        steps:[
          {
            element: 'body',
            intro: `<h6 style='color: maroon; font-weight: 900'>Welcome to Cards For Humanity</h6>`
          },
          {
            element: '#start-game-button',
            intro: '<p>Click to start game with at least 3 people<p>',
          },
          {
            element: '#invite',
            intro: `<p>Invite your friends to join. The more, the merrier</p>`,
            position: 'bottom'
          },
          {
            element: '#abandon-game-button',
            intro: `<p>Played enough?</p>
              <p>Click here to leave game when at any point<p>`,
          },
          {
            element: '#timer-container',
            intro: `<p>This is the game timer.<p>
              <p>Submit your answers before it runs out.</p>`
          },
          {
            element: '#question-container-outer',
            intro: '<p>The question for each round shows up here.</p>'
          },
          {
            element: '#social-bar-container',
            intro: '<p>Game participant avatars.</p>'
          },
          {
            element: '#inner-info',
            intro: '<p>Game instructions.</p>'
          },
          {
            element: '#chat-box',
            intro: '<p>Chat with other players with the game chat.</p>'
          },
          {
            element: '#donate-btn',
            intro: '<p>Be a do-gooder. Support the cause.</p>'
          },
          {
            element: 'body',
            intro: `<h5>That's it.</h5>
              <p>Click <em>'Done'</em> to end tour </p>.`
          }
        ],

        showStepNumbers: false,
        showBullets: false,
        exitOnOverlayClick: true,
        exitOnEsc:true,
        nextLabel: '<span style="color:green">Next</span>',
        prevLabel: '<span style="color:green">Previous</span>',
        skipLabel: '<span style="color:red">Skip</span>',
        doneLabel: 'Done'
    };

    $scope.startTour = () => {
      $scope.introJs.setOptions($scope.IntroOptions);
      $scope.introJs.start();
    };
    $scope.shuffleCards = () => {
      const card = $(`#${event.target.id}`);
      card.addClass('animated flipOutY');
      setTimeout(() => {
        $scope.startNextRound();
        card.removeClass('animated flipOutY');
        $('#czarModal').modal('close');
      }, 500);
    };

    $scope.startNextRound = () => {
      if ($scope.isCzar()) {
        game.startNextRound();
      }
    };
      // makes sure the games users does not exceed the game user limit before user joins
      if ($location.search().game && !(/^\d+$/).test($location.search().game) && (game.players.length > game.playerMaxLimit)) {
        const popupModal = $('#popUpModal');

        popupModal.find('.modal-body')
          .text('You cannot exceed a maximum of 12 players per game');

        popupModal.modal('show');
      } else if ($location.search().custom && game.players.length > game.playerMaxLimit) {
        popupModal.find('.modal-body')
          .text('You cannot exceed a maximum of 12 players per game');

        popupModal.modal('show');
      } else if ($location.search().game && !(/^\d+$/).test($location.search().game) && (game.players.length <= game.playerMaxLimit)) {
        console.log('joining custom game');
        game.joinGame('joinGame', $location.search().game);
      } else if ($location.search().custom && game.players.length <= game.playerMaxLimit) {
        console.log('join game as a stranger');
        game.joinGame('joinGame', null, true);
      } else {
        game.joinGame();
      }
    }
  ]);
