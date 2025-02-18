import { useRef, useCallback } from 'react'
import {
  createBoard,
  rotateMatrix,
  getDropInterval,
  calculateScore
} from '@/utils/gameLogic'
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PIECES,
  PIECES_COLORS
} from '@/consts/const'

const useTetrisGame = () => {
  const gameStateRef = useRef({
    board: createBoard(BOARD_WIDTH, BOARD_HEIGHT),
    piece: null,
    dropCounter: 0,
    lastTime: 0,
    running: false,
    score: 0,
    level: 1,
    linesCleared: 0,
    combo: 0,
    dropInterval: getDropInterval(1)
  })

  // Genera una nueva pieza aleatoria
  const generatePiece = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * PIECES.length)
    return {
      position: { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 },
      shape: PIECES[shapeIndex],
      color: PIECES_COLORS[shapeIndex]
    }
  }, [])

  // Verifica colisiones de la pieza contra los límites y bloques fijos del tablero
  const checkCollision = useCallback((piece, board) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardY = y + piece.position.y
          const boardX = x + piece.position.x
          if (
            boardY < 0 ||
            boardY >= BOARD_HEIGHT ||
            boardX < 0 ||
            boardX >= BOARD_WIDTH ||
            board[boardY][boardX] !== 0
          ) {
            return true
          }
        }
      }
    }
    return false
  }, [])

  // Implementa wall kicks para rotaciones más naturales
  const attemptRotation = useCallback(() => {
    const gameState = gameStateRef.current
    const { piece, board } = gameState
    const originalShape = piece.shape
    const rotated = rotateMatrix(piece.shape)
    piece.shape = rotated

    const offsets = [-1, 1, -2, 2]
    let rotatedSuccessfully = !checkCollision(piece, board)
    for (let offset of offsets) {
      if (rotatedSuccessfully) break
      piece.position.x += offset
      if (!checkCollision(piece, board)) {
        rotatedSuccessfully = true
        break
      }
      piece.position.x -= offset
    }
    if (!rotatedSuccessfully) {
      piece.shape = originalShape
    }
  }, [checkCollision])

  // Fija la pieza en el tablero y genera una nueva; si la nueva pieza colisiona, se debe terminar la partida
  const solidifyPiece = useCallback(
    (handleGameOver) => {
      const gameState = gameStateRef.current
      const { piece, board } = gameState
      piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            board[y + piece.position.y][x + piece.position.x] = 1
          }
        })
      })
      gameState.piece = generatePiece()
      if (checkCollision(gameState.piece, board)) {
        handleGameOver()
      }
    },
    [checkCollision, generatePiece]
  )

  // Elimina filas completas y actualiza puntuación, líneas y nivel
  const removeFullRows = useCallback(() => {
    const gameState = gameStateRef.current
    const { board } = gameState
    let rowsRemoved = 0

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (board[y].every((cell) => cell !== 0)) {
        board.splice(y, 1)
        board.unshift(Array(BOARD_WIDTH).fill(0))
        rowsRemoved++
        y++ // Revisa nuevamente la misma fila
      }
    }

    if (rowsRemoved > 0) {
      gameState.combo = (gameState.combo || 0) + 1
      gameState.score += calculateScore(
        rowsRemoved,
        gameState.level,
        gameState.combo
      )
      gameState.linesCleared += rowsRemoved
      const newLevel = Math.floor(gameState.linesCleared / 10) + 1
      if (newLevel > gameState.level) {
        gameState.level = newLevel
        gameState.dropInterval = getDropInterval(newLevel)
      }
    } else {
      gameState.combo = 0
    }
    return rowsRemoved
  }, [])

  return {
    gameStateRef,
    generatePiece,
    checkCollision,
    attemptRotation,
    solidifyPiece,
    removeFullRows
  }
}

export default useTetrisGame
