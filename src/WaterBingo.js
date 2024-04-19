import React, { useState, useEffect, useCallback } from "react";
import { Button, Box } from "@mui/material";

function WaterBingo() {
  // Generating an array of image URLs based on the naming pattern
  const images = Array.from(
    { length: 27 },
    (_, i) => `/images/Slide${i + 1}.PNG`
  );

  const [currentImage, setCurrentImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [gameStarted, setGameStarted] = useState(false);
  const [shuffledImages, setShuffledImages] = useState([]);

  const navigateNext = useCallback(() => {
    if (currentIndex < shuffledImages.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentImage(shuffledImages[nextIndex]);
      setCurrentIndex(nextIndex);
    } else {
      restartGame();
    }
  }, [currentIndex, shuffledImages]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.key === " " || event.key === "ArrowRight") && gameStarted) {
        navigateNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentIndex, shuffledImages, gameStarted, navigateNext]);

  const startGame = () => {
    const shuffled = [...images].sort(() => 0.5 - Math.random());
    setShuffledImages(shuffled);
    setCurrentIndex(0);
    setCurrentImage(shuffled[0]);
    setGameStarted(true);
  };

  const restartGame = () => {
    setCurrentIndex(-1);
    setCurrentImage(null);
    setGameStarted(false);
    setShuffledImages([]);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: 10,
        boxSizing: "border-box",
      }}
    >
      {!gameStarted ? (
        <Button
          variant="outlined"
          color="primary"
          onClick={startGame}
          sx={{
            height: 80,
            // width: 300,
            paddingX: 5,
            fontSize: 26,
            fontWeight: "bold",
            border: "5px solid",
            "&:hover": {
              backgroundColor: "lightblue",
              border: "5px solid",
            },
          }}
        >
          Start Water Bingo!
        </Button>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <img
            src={currentImage}
            alt={`Slide ${currentIndex + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              border: "1px solid black",
            }}
          />
          <Box
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
              width: "100%",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              onClick={restartGame}
              sx={{
                height: 80,
                width: 240,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Restart Game
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={navigateNext}
              sx={{
                height: 80,
                width: 240,
                fontSize: 26,
                fontWeight: "bold",
              }}
            >
              Next Image
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default WaterBingo;
