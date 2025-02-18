import { useRef, useState, useEffect, useCallback } from 'react'
import useTetrisGame from '@/hooks/useTetrisGame'
import {
  BLOCK_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  EVENT_MOVEMENTS
} from '@/consts/const'

const TetrisGame = () => {
  const canvasRef = useRef(null)
  const animationFrameIdRef = useRef(null)

  // Estados para mostrar la puntuación y nivel en la UI
  const [displayScore, setDisplayScore] = useState(0)
  const [displayLevel, setDisplayLevel] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)

  const {
    gameStateRef,
    generatePiece,
    checkCollision,
    attemptRotation,
    solidifyPiece,
    removeFullRows
  } = useTetrisGame()

  // Función para manejar el fin de la partida (Game Over)
  const handleGameOver = useCallback(() => {
    const gameState = gameStateRef.current
    gameState.running = false
    // Reinicia el estado interno del juego
    gameState.score = 0
    gameState.linesCleared = 0
    gameState.combo = 0
    gameState.level = 1
    gameState.dropInterval = 1000
    // Actualiza la UI
    setDisplayScore(0)
    setDisplayLevel(1)
    setGameStarted(false)
  }, [gameStateRef])

  // Dibuja el estado actual en el canvas (tablero y pieza en movimiento)
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    const gameState = gameStateRef.current

    // Limpiar canvas (usamos las dimensiones lógicas del tablero)
    context.fillStyle = '#24243e'
    context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

    // Dibujar bloques fijos
    gameState.board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          context.fillStyle = '#78ffd6'
          context.fillRect(x, y, 1, 1)
        }
      })
    })

    // Dibujar la pieza actual
    const { piece } = gameState
    if (piece) {
      piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            context.fillStyle = piece.color
            context.fillRect(x + piece.position.x, y + piece.position.y, 1, 1)
          }
        })
      })
    }
  }, [gameStateRef])

  // Ciclo principal del juego (Game Loop)
  const updateGame = useCallback(
    (time = 0) => {
      const gameState = gameStateRef.current
      if (!gameState.running) return

      const deltaTime = time - gameState.lastTime
      gameState.lastTime = time
      gameState.dropCounter += deltaTime

      if (gameState.dropCounter > gameState.dropInterval) {
        gameState.piece.position.y++
        if (checkCollision(gameState.piece, gameState.board)) {
          gameState.piece.position.y--
          solidifyPiece(handleGameOver)
          removeFullRows()
          setDisplayScore(gameState.score)
          setDisplayLevel(gameState.level)
        }
        gameState.dropCounter = 0
      }
      drawGame()
      animationFrameIdRef.current = window.requestAnimationFrame(updateGame)
    },
    [
      checkCollision,
      drawGame,
      removeFullRows,
      solidifyPiece,
      gameStateRef,
      handleGameOver
    ]
  )

  // Maneja los eventos de teclado para mover, bajar y rotar la pieza
  const handleKeyDown = useCallback(
    (event) => {
      const gameState = gameStateRef.current
      if (!gameState.running) return
      const { piece, board } = gameState
      switch (event.key) {
        case EVENT_MOVEMENTS.LEFT:
          piece.position.x--
          if (checkCollision(piece, board)) piece.position.x++
          break
        case EVENT_MOVEMENTS.RIGHT:
          piece.position.x++
          if (checkCollision(piece, board)) piece.position.x--
          break
        case EVENT_MOVEMENTS.DOWN:
          piece.position.y++
          if (checkCollision(piece, board)) {
            piece.position.y--
            solidifyPiece(handleGameOver)
            removeFullRows()
            setDisplayScore(gameState.score)
            setDisplayLevel(gameState.level)
          }
          gameState.dropCounter = 0
          break
        case EVENT_MOVEMENTS.UP:
          attemptRotation()
          break
        default:
          break
      }
    },
    [
      checkCollision,
      attemptRotation,
      removeFullRows,
      solidifyPiece,
      handleGameOver,
      gameStateRef
    ]
  )

  // Inicializa el juego cuando se inicia la partida
  useEffect(() => {
    if (!gameStarted) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = BLOCK_SIZE * BOARD_WIDTH
    canvas.height = BLOCK_SIZE * BOARD_HEIGHT
    const context = canvas.getContext('2d')
    context.scale(BLOCK_SIZE, BLOCK_SIZE)

    // Inicializar estado del juego
    gameStateRef.current.board = Array.from({ length: BOARD_HEIGHT }, () =>
      Array(BOARD_WIDTH).fill(0)
    )
    gameStateRef.current.piece = generatePiece()
    gameStateRef.current.dropCounter = 0
    gameStateRef.current.lastTime = 0
    gameStateRef.current.running = true
    gameStateRef.current.score = 0
    gameStateRef.current.level = 1
    gameStateRef.current.linesCleared = 0
    gameStateRef.current.combo = 0
    gameStateRef.current.dropInterval = 1000

    window.addEventListener('keydown', handleKeyDown)
    animationFrameIdRef.current = window.requestAnimationFrame(updateGame)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (animationFrameIdRef.current) {
        window.cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [gameStarted, generatePiece, handleKeyDown, updateGame, gameStateRef])

  return (
    <div className='flex flex-col items-center justify-center gap-y-8'>
      <div className='flex gap-x-4'>
        <h2 className='text-neutral-100 text-xl px-4 py-2 rounded-xl bg-neutral-100/10 cursor-default hover:scale-110 transition-transform duration-300'>
          Puntuación: <span>{displayScore}</span>
        </h2>
        <h2 className='text-neutral-100 text-xl px-4 py-2 rounded-xl bg-neutral-100/10 cursor-default hover:scale-110 transition-transform duration-300'>
          Nivel: <span>{displayLevel}</span>
        </h2>
      </div>
      <canvas
        ref={canvasRef}
        className='w-[282px] h-[600px] bg-[#24243e] rounded-2xl'
      />
      {!gameStarted && (
        <button
          className='px-4 py-2 rounded-xl backdrop-blur-md border-0 shadow-xl bg-neutral-100/10 hover:bg-zinc-700/30 text-2xl text-neutral-100 hover:-translate-y-1 cursor-pointer transtion-transform duration-300'
          onClick={() => setGameStarted(true)}
        >
          Start Game
        </button>
      )}
    </div>
  )
}

export default TetrisGame
