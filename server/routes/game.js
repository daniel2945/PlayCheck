const express = require("express");
const gameRouter = express.Router();
const {
  searchGames,
  searchGame,
  createGame,
  getSavedGames,
  getSavedGameById,
  deleteGame,
  updateGame,
  checkCompatibilityGuest,
  checkCompatibilityUser,
} = require("../controllers/game");
const { verifyToken, forAdmins } = require("../middlewares/auth");


gameRouter.get("/search", searchGames);
gameRouter.get("/search/:id", searchGame);
gameRouter.post("/guest/check/:id", checkCompatibilityGuest);

gameRouter.get("/user/check/:id", verifyToken, checkCompatibilityUser);
gameRouter.get("/", verifyToken, forAdmins, getSavedGames);

gameRouter.route("/:id")
  .post(createGame)                                    
  .get(verifyToken, forAdmins, getSavedGameById)                   
  .put(verifyToken, forAdmins, updateGame)              
  .delete(verifyToken, forAdmins, deleteGame);      

module.exports = gameRouter;