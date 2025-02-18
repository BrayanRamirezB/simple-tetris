// Crea el tablero inicial
export const createBoard = (width, height) =>
  Array.from({ length: height }, () => Array(width).fill(0))

// Rota una matriz 90° en sentido horario
export const rotateMatrix = (matrix) =>
  matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse())

// Calcula el intervalo de caída según el nivel (mínimo 200 ms)
export const getDropInterval = (level) =>
  Math.max(1000 - (level - 1) * 100, 200)

// Calcula la puntuación basado en el número de filas eliminadas, el nivel y el combo
export const calculateScore = (rowsRemoved, level, combo) => {
  const scoreTable = { 1: 100, 2: 300, 3: 500, 4: 800 }
  const baseScore = scoreTable[rowsRemoved] || rowsRemoved * 200
  const comboBonus = (combo - 1) * 50
  return (baseScore + comboBonus) * level
}
