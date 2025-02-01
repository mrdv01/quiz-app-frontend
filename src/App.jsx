import { useState, useEffect } from "react";
import axios from "axios";
import { RiTimerLine } from "react-icons/ri";
import { GiPodiumWinner } from "react-icons/gi";

const App = () => {
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Create audio elements
    const correctAudio = new Audio("/sounds/correct.mp3");
    const wrongAudio = new Audio("/sounds/wrong.mp3");
    const timerAudio = new Audio("/sounds/timer.mp3");

    // Preload the audio files
    correctAudio.load();
    wrongAudio.load();
    timerAudio.load();

    window.quizSounds = {
      playCorrect: () => correctAudio.play().catch(() => {}),
      playWrong: () => wrongAudio.play().catch(() => {}),
      playTimer: () => timerAudio.play().catch(() => {}),
      stopTimer: () => {
        timerAudio.pause();
        timerAudio.currentTime = 0;
      },
    };

    // Cleanup
    return () => {
      correctAudio.remove();
      wrongAudio.remove();
      timerAudio.remove();
      delete window.quizSounds;
    };
  }, []);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/quiz");
        setQuizData(response.data.questions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setError("Failed to load quiz data. Please try again later.");
        setLoading(false);
      }
    };
    fetchQuizData();
  }, []);

  useEffect(() => {
    if (timer > 0 && !isAnswered) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);

      // Play countdown sound when timer reaches 3 seconds
      if (timer === 4) {
        window.quizSounds?.playTimer();
      }

      return () => {
        clearTimeout(countdown);
        // Stop the timer sound if the user answers before 3 seconds are left
        if (isAnswered && timer <= 4) {
          window.quizSounds?.stopTimer();
        }
      };
    } else if (timer === 0 && !isAnswered) {
      handleAnswer(false);
    }
  }, [timer, isAnswered]);

  const handleAnswer = (is_correct) => {
    setIsAnswered(true);
    // Stop the timer sound if it's playing and there are 3 or fewer seconds left
    if (timer <= 4) {
      window.quizSounds?.stopTimer();
    }

    if (is_correct) {
      setScore((prev) => prev + 1);
      setStreak(streak + 1);
      window.quizSounds?.playCorrect();
    } else {
      setStreak(0);
      window.quizSounds?.playWrong();
    }

    // Move to the next question after 1 second
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < quizData.length) {
        setCurrentQuestion(nextQuestion);
        setTimer(10);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        setShowResult(true);
        updateLeaderboard(score + (is_correct ? 1 : 0));
      }
    }, 1000);
  };

  const updateLeaderboard = (newScore) => {
    const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
    scores.push(newScore);
    scores.sort((a, b) => b - a);
    localStorage.setItem("leaderboard", JSON.stringify(scores.slice(0, 5)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="text-white text-2xl font-semibold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-red-500 to-pink-600">
        <div className="text-white text-2xl font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      {showResult ? (
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md w-full animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800">Quiz Completed!</h2>
          <p className="text-xl mt-4 text-gray-700">
            Your Score:{" "}
            <span className="font-bold text-green-500">{score}</span> /{" "}
            {quizData.length}
          </p>
          <p className="text-xl mt-2 text-gray-700">
            Highest Streak:{" "}
            <span className="font-bold text-green-500">{streak}</span>
          </p>
          <div className="flex justify-center gap-2 mt-5">
            <h3 className="text-2xl font-semibold text-gray-800">
              Leaderboard
            </h3>
            <GiPodiumWinner className="w-10 h-8 text-yellow-400" />
          </div>

          <ul className="mt-4 space-y-2">
            {JSON.parse(localStorage.getItem("leaderboard"))?.map((s, i) => (
              <li key={i} className="text-lg text-gray-700">
                {i + 1}. {s} points
              </li>
            ))}
          </ul>
          <button
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
            onClick={() => {
              setCurrentQuestion(0);
              setScore(0);
              setStreak(0);
              setShowResult(false);
              setIsAnswered(false);
              setTimer(10);
            }}
          >
            Restart Quiz
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full relative animate-fade-in">
          <div className="absolute top-4 right-4 text-sm text-gray-600 flex gap-1">
            <RiTimerLine />
            <span className="font-bold">{timer}s</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {quizData[currentQuestion]?.description}
          </h2>
          <div className="mt-6 space-y-4">
            {quizData[currentQuestion]?.options?.map((option, index) => (
              <button
                key={index}
                className={`w-full py-3 px-6 rounded-lg transition duration-300 text-left text-gray-800 transform hover:scale-102 ${
                  isAnswered
                    ? option.is_correct
                      ? "bg-green-500 text-white"
                      : selectedAnswer === index
                      ? "bg-red-500 text-white"
                      : "bg-gray-100"
                    : "bg-gray-100 hover:bg-blue-100"
                }`}
                onClick={() => {
                  setSelectedAnswer(index);
                  handleAnswer(option.is_correct);
                }}
                disabled={isAnswered}
              >
                {option?.description}
              </button>
            ))}
          </div>
          <div className="mt-6 text-sm text-gray-600">
            Current Streak:{" "}
            <span className="font-bold text-blue-600">{streak}</span>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((currentQuestion + 1) / quizData.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
