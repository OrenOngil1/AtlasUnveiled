export { 
  db, 
  initializeDatabase,
  type ExploredPoint,
  type User,
} from './database';

export {
  saveExploredPoint,
  isDuplicatePoint,
  getAllExploredPoints,
  getExploredPointsCount,
  getPointsInBounds,
  getPointById,
  deletePoint,
  clearAllPoints,
} from './exploredPoints';

export {
  createUser,
  getUserById,
  getUserByUsername,
  getAllUsers,
  getCurrentUser,
  updateUsername,
  updateTotalDistance,
  addDistance,
  deleteUser,
} from './users';
