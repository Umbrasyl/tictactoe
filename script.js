"use strict";

const game = (function(){
  const players = ["X", "O"];
  const scores = [0, 0];
  let currentPlayerIndex = 0;
  let AiIsPlaying = false;

  const setScores = function(inputSymbol) {
    console.log(inputSymbol);
    const resultDiv = document.querySelector(".result");
    if (inputSymbol === "X") {
      resultDiv.innerHTML = "Player 1 wins!";
      scores[0]++;
      document.querySelector(".score1").innerHTML = scores[0];
    } else if (inputSymbol === "O") {
      resultDiv.innerHTML = "Player 1 loses!"
      scores[1]++;
      document.querySelector(".score2").innerHTML = scores[1];
    } else {
      resultDiv.innerHTML = "It's a draw!"
    }
  }

  const initGame = function() {
    currentPlayerIndex = 0;
    board.resetBoard();
    [...squares].forEach(element => {
      element.innerHTML = "";
    });
    document.querySelector(".result").innerHTML = "";
    [...squares].forEach(element => {
      element.addEventListener("click", board.onSquareClick);
    });
  }

  const playerChoice = function () {
    if (this.dataset.ai === "1") {
      AiIsPlaying = true;
    } else {
      document.querySelector(".span-player2").innerHTML = "Player 2";
    }
    initScreen.classList.toggle("hidden");
  }

  const setCurrentPlayer = function() {
    currentPlayerIndex++;
    if (currentPlayerIndex >= players.length) {
      currentPlayerIndex = 0;
    }
    if (currentPlayerIndex === 1 && AiIsPlaying) {
      artificialPlayer.makeMove();
    }
  }

  const getCurrentSymbol = function() {
    return players[currentPlayerIndex];
  }

  return { initGame, setCurrentPlayer, getCurrentSymbol, playerChoice, setScores }
})();

const board = (function(){
  let boardArray = [[], [], []];
  let moveCount = 0;

  const resetBoard = function() {
    boardArray = [[], [], []];
    moveCount = 0;
  }

  const getCurrentBoardState = function() {
    return [...boardArray];
  }

  const isAllSame = function(inputArray, inputSymbol) {
    for (let i = 0; i < 3; i++) {
      if (inputArray[i] !== inputSymbol) {
        return false;
      }
    }
    return true;
  }

  const checkRow = function(currentBoardState, inputRow, inputSymbol) {
    const currentRow = currentBoardState[inputRow];
    if (currentRow.length !== 3) {
      return false
    }
    return isAllSame(currentRow, inputSymbol);
  }

  const checkColumn = function(currentBoardState, inputColumn, inputSymbol) {
    const currentColumn = [];
    for (let i = 0; i < 3; i++) {
      currentColumn.push(currentBoardState[i][inputColumn]);
    }
    return isAllSame(currentColumn, inputSymbol);
  }

  const checkDiag = function(currentBoardState, inputRow, inputColumn, inputSymbol) {
    const diag1 = [currentBoardState[0][0], currentBoardState[1][1], currentBoardState[2][2]];
    const diag2 = [currentBoardState[2][0], currentBoardState[1][1], currentBoardState[0][2]];
    if (inputRow === 1 && inputColumn === 1) {
      return (isAllSame(diag1, inputSymbol) || isAllSame(diag2, inputSymbol));
    }
    if (inputRow === inputColumn) {
      return isAllSame(diag1, inputSymbol);
    } else {
      return isAllSame(diag2, inputSymbol);
    }
  }

  const checkWin = function(currentBoardState, inputSquare, inputSymbol) {
    const row = inputSquare[0];
    const column = inputSquare[1];
    if (checkRow(currentBoardState, row, inputSymbol)) {
      return true;
    }
    if (checkColumn(currentBoardState, column, inputSymbol)) {
      return true;
    }
    // Below logic is to determine squares where diagonal win is possible. 5 out of 9 squares this is possible.
    if ( row === column || Math.abs(row - column) === 2) {
      if (checkDiag(currentBoardState, row, column, inputSymbol)) {
        return true;
      }
    }
    return false;
  }

  const onSquareClick = function () {
    const currentSymbol = game.getCurrentSymbol()
    const currentSquare = indexConverter(this.dataset.square);
    this.innerHTML = currentSymbol;
    boardArray[currentSquare[0]][currentSquare[1]] = currentSymbol;
    this.removeEventListener("click", board.onSquareClick);
    moveCount++;
    if (checkWin(boardArray, currentSquare, currentSymbol)) {
      game.setScores(currentSymbol);
      setTimeout(game.initGame, 3000);
      return;
    }
    if (moveCount === 9) {
      game.setScores("");
      setTimeout(game.initGame, 3000);
      return;
    }
    game.setCurrentPlayer();
  }

  const indexConverter = function(squareNumber) {
    const row = Math.floor(squareNumber / 3);
    const column = squareNumber % 3;
    return [row, column]
  }

  return { onSquareClick, getCurrentBoardState, checkWin, resetBoard }
})();

const artificialPlayer = (function() {

  const makeMove = function() {
    const bestMove = findBestMove(board.getCurrentBoardState(), 0, true);
    const squareToClick = (bestMove[0] * 3) + (bestMove[1]);
    document.querySelector(`[data-square='${squareToClick}']`).click();
  }

  const findBestMove = function(currentBoardState, level, isAI) {
    const possibleMoves = findPossibleMoves(currentBoardState);
    const currentSymbol = isAI ? "O" : "X";
    // The base case is all the possible moves are checked and no victory was found for either side.

    // Checking for 1 move win. If victory is not possible in one move then we recursively check for further levels deep.
    for (let i = 0; i < possibleMoves.length; i++) {
      const currentMove = possibleMoves[i];
      const newBoard = structuredClone(currentBoardState);
      newBoard[currentMove[0]][currentMove[1]] = currentSymbol;
      if (board.checkWin(newBoard, currentMove, currentSymbol)) {
        if (isAI) {
          //console.log([...currentMove, (20 - level)]);
          // If we are checking for if the AI will win then these moves should be prioritized.
          return [...currentMove, (20 - level)];
        } else {
          //console.log([...currentMove, (level - 10)]);
          // If this set of moves led to a lose then the AI should'nt make the parent moves.
          return [...currentMove, (level - 10)];
        }
      } else {
        if (possibleMoves.length === 1) {
          return [...possibleMoves[0], level];
        }
        possibleMoves[i].push(findBestMove(newBoard, level+1, !isAI)[2]);
      }
    }
    const sortedMoves = possibleMoves.sort((a, b) =>  b[2] - a[2] );
    if (isAI) {
      return sortedMoves[0];
    } else {
      return sortedMoves[sortedMoves.length - 1];
    }
  }

  const findPossibleMoves = function(currentBoardState) {
    const possibleMovesArray = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (currentBoardState[i][j] === undefined) {
          possibleMovesArray.push([i, j])
        }
      }
    }
    return possibleMovesArray;
  }

  return { makeMove }
})();

const initScreen = document.querySelector(".init-screen");
const playerNumberButtons = document.getElementsByClassName("player-choice");
[...playerNumberButtons].forEach((element) => {
  element.addEventListener("click", game.playerChoice);
});

const squares = document.getElementsByClassName("square");
[...squares].forEach(element => {
  element.addEventListener("click", board.onSquareClick);
});
