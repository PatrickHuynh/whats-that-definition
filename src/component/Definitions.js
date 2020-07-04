import React, { useState, useEffect } from "react";
import axios from "axios";
import stringSimilarity from "string-similarity";
import cloneDeep from "lodash/cloneDeep";

import { ToastContainer, toast, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import stopwords from "../data/stopwords";
import definitions from "../data/definitions";

import logo from "../book-open-flat.png";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continous = false;
recognition.lang = "en-US";

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

function PowerLevelBar(props) {
  const calcState = () => {
    let barState = 0;
    if (props.powerLevel > 80) {
      barState = "bg-success";
    } else if (props.powerLevel > 50) {
      barState = "bg-warning";
    } else {
      barState = "bg-danger";
    }
    return barState;
  };

  return (
    <div className="progress" style={{ height: `36px` }}>
      <div
        className={"progress-bar " + calcState()}
        role="progressbar"
        style={{ width: `${props.powerLevel}%`, fontSize: "24px" }}
      >
        Your Collection of Merit
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

const maskWordList = (definition) => {
  let words = definition.replace("'", "").match(/\b(\w+)\b/g);
  let wordProps = [];
  let wordIndex;
  for (wordIndex in words) {
    wordProps.push({
      wordIndex: wordIndex,
      word: words[wordIndex],
      stopWord: stopwords.indexOf(words[wordIndex]) !== -1,
      maskWord: stopwords.indexOf(words[wordIndex]) === -1,
      markedWord: false,
    });
  }
  let scoreWords = [];
  let scoreWordsIndex = [];
  for (let i = 0; i < wordProps.length; i++) {
    if (!wordProps[i]["stopWord"]) {
      scoreWords.push(wordProps[i]["word"]);
      scoreWordsIndex.push(i);
    }
  }
  return [wordProps, scoreWords, scoreWordsIndex];
};

const getDefinitionWithProps = (definition) => {
  let definitionWithProps = definition;
  let [wordProps, scoreWords, scoreWordsIndex] = maskWordList(
    definition.definition
  );
  definitionWithProps["wordProps"] = wordProps;
  definitionWithProps["scoreWords"] = scoreWords;
  definitionWithProps["scoreWordsIndex"] = scoreWordsIndex;
  return definitionWithProps;
};

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

function Definitions(props) {
  const [definitionArray, setDefinitionArray] = useState(definitions);
  const [definition, setDefinition] = useState(
    getDefinitionWithProps(
      definitionArray[Math.floor(Math.random() * definitionArray.length)]
    )
  );
  const [definitionHintState, setDefinitionHintState] = useState(0);
  const [completedDefinitions, setCompletedDefinitions] = useState(new Set([]));

  const [hintButtonText, setHintButtonText] = useState("Hint");
  const [answerScore, setAnswerScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [powerLevel, setPowerLevel] = useState(90);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);

  useEffect(() => {
    const powerLevelTimer = setTimeout(() => {
      setPowerLevelWithRange(powerLevel, -0.25, false);
    }, 250);
    return () => clearTimeout(powerLevelTimer);
  });

  const setPowerLevelWithRange = (
    powerLevel,
    powerLevelChange,
    notify,
    notifyMessage
  ) => {
    setPowerLevel(Math.min(100, Math.max(0, powerLevel + powerLevelChange)));
    if (notify) {
      if (powerLevelChange < 0) {
        toast.error("Merit " + powerLevelChange);
      } else {
        toast.success("Merit +" + powerLevelChange);
      }
    }
  };

  const handleNext = () => {
    // if definitions have all run out - you have won! show retry
    // remove completed definitions
    let availableDefinitions = getAvailableDefinitions();
    let nextDefinitionIndex =
      availableDefinitions[
        Math.floor(Math.random() * availableDefinitions.length)
      ];
    if (availableDefinitions.length === 0) {
      nextDefinitionIndex = 0;
    }

    // set the new definition
    setDefinition(getDefinitionWithProps(definitions[nextDefinitionIndex]));

    // if the answer has already been revealed
    if ((answerScore < 1) & (definitionHintState === -1)) {
      setPowerLevelWithRange(powerLevel, -5, true);
    }

    // reset form
    setDefinitionHintState(0);
    setHintButtonText("Hint");
    setAnswer("");
    setAnswerScore(0);
    setAnswerSubmitted(false);
  };

  const handleHint = () => {
    setDefinitionHintState(1);

    // update form
    setHintButtonText("Click (........) for hint");

    // update score progress
    setPowerLevelWithRange(powerLevel, -5, true);
  };

  const getAvailableDefinitions = () => {
    let availableDefinitions = [...definitionArray.keys()];
    availableDefinitions = availableDefinitions.filter((idx) => {
      return !completedDefinitions.has(idx);
    });
    return availableDefinitions;
  };

  const handleReveal = () => {
    setDefinitionHintState(-1);
    setPowerLevelWithRange(powerLevel, -5, true);
  };

  const handleSubmitAnswer = () => {
    // check answer score
    let checkAnswerScore = 0;
    if (definition.definition ? (answer ? true : false) : false) {
      checkAnswerScore = scoreAnswer(answer, false);
    } else {
      checkAnswerScore = 0;
    }

    // update form states
    if (checkAnswerScore < 100) {
      setDefinitionHintState(1);
    }
    setAnswerScore(checkAnswerScore);
    setAnswerSubmitted(true);
    if (checkAnswerScore >= 1) {
      setCompletedDefinitions(
        new Set([
          ...completedDefinitions,
          definitions.map((d) => d.name).indexOf(definition.name),
        ])
      );
      setPowerLevelWithRange(
        powerLevel,
        definition.scoreWords.length * 5,
        true
      );
      setDefinitionHintState(-1);
      setHintButtonText("Hint");
    } else {
      let maskWordCountList = definition.wordProps.map((wordProp) => {
        return wordProp.maskWord ? 1 : 0;
      });
      let maskWordCount = maskWordCountList.reduce((sum, num) => {
        return sum + num;
      });
      if (maskWordCount === 0) {
        setDefinitionHintState(-1);
      }
      setPowerLevelWithRange(powerLevel, -10, true);
      setHintButtonText("Click (........) for hint");
    }
  };

  const scoreAnswer = (answer, strictMode) => {
    let modifiedDefinition;
    let modifiedAnswer;
    modifiedDefinition = definition.scoreWords;
    modifiedAnswer = maskWordList(answer)[1];
    if (!strictMode) {
      let imax = Math.min(definition.scoreWords.length, modifiedAnswer.length);
      for (let i = 0; i < definition.scoreWords.length; i++) {
        definition.wordProps[definition.scoreWordsIndex[i]].markedWord = false;
      }
      for (let i = 0; i < imax; i++) {
        if (
          definition.scoreWords[i].toLowerCase() ===
          modifiedAnswer[i].toLowerCase()
        ) {
          definition.wordProps[definition.scoreWordsIndex[i]].markedWord = true;
          definition.wordProps[definition.scoreWordsIndex[i]].maskWord = false;
        }
      }
    } else {
      // todo hard mode i.e. word for word must be correct
    }
    let checkAnswerScore = stringSimilarity.compareTwoStrings(
      modifiedDefinition.join(" ").toLowerCase(),
      modifiedAnswer.join(" ").toLowerCase()
    );
    setDefinition(cloneDeep(definition));
    return checkAnswerScore;
  };

  const handleKeyPress = (e) => {
    let keyCode = e.keyCode || e.which;
    if (keyCode === 13 || keyCode === 10) {
      e.preventDefault();
      if (definitionHintState !== -1) {
        handleSubmitAnswer();
      }
    }
    if (definitionHintState === -1) {
      handleNext();
    }
  };

  const scoreEncouragement = () => {
    let encouragement;
    if (answerScore < 0.5) {
      encouragement = "Not quite right";
    } else if (answerScore < 0.9) {
      encouragement = "Check wording";
    } else if (answerScore < 1) {
      encouragement = "Getting closer!";
    } else if (answerScore >= 1) {
      encouragement = "Perfect!";
    }
    encouragement =
      encouragement + " (Similarity: " + Math.floor(answerScore * 100) + "%)";
    return encouragement;
  };

  const showDefinition = () => {
    if (definitionHintState === -1) {
      return definition.definition;
    } else if (definitionHintState === 1) {
      return maskDefinition();
    } else {
      return "";
    }
  };

  const maskDefinition = () => {
    return definition.wordProps.map((wordProps) => {
      // if is a stop word: just display it
      if (wordProps.stopWord) {
        return <>{wordProps.word} </>;
      }
      // if it is not a stop word:
      else if (wordProps.maskWord) {
        // if it is masked, then mask
        let displayWord = ".".repeat(wordProps.word.length);
        return (
          <>
            <span
              key={wordProps.wordIndex}
              onClick={(e) => handleUnmaskWord(wordProps.wordIndex)}
              style={{
                fontSize: "24px",
                fontFamily: "Lucida Console",
                backgroundColor: "yellow",
              }}
            >
              {displayWord}
            </span>{" "}
          </>
        );
      } else {
        // if it is marked === false then red
        // if it is marked === true then green
        return (
          <>
            <span
              key={wordProps.wordIndex}
              style={{
                fontSize: "24px",
                fontFamily: "Lucida Console",
                backgroundColor: wordProps.markedWord ? "lime" : "red",
              }}
            >
              {wordProps.word}
            </span>{" "}
          </>
        );
      }
    });
  };

  const handleUnmaskWord = (wordIndex) => {
    let wordProps = definition.wordProps.slice();
    wordProps[wordIndex]["maskWord"] = false;
    setDefinition({ ...definition, wordProps: wordProps });
    setPowerLevelWithRange(powerLevel, -5, true);
    let maskWordCountList = wordProps.map((wordProp) => {
      return wordProp.maskWord ? 1 : 0;
    });
    let maskWordCount = maskWordCountList.reduce((sum, num) => {
      return sum + num;
    });
    if (maskWordCount === 0) {
      setDefinitionHintState(-1);
    }
  };

  const handleReplay = () => {
    setCompletedDefinitions(new Set([]));
    setDefinitionHintState(0);
    setHintButtonText("Hint");
    setAnswer("");
    setAnswerScore(0);
    setAnswerSubmitted(false);
    setPowerLevelWithRange(powerLevel, 9000, true);
  };

  const handleListen = () => {
    setSpeechListening(true);
    recognition.start();
  };

  const handleSpeechRecognitionResult = (event) => {
    setAnswer(answer + " " + event.results[0][0].transcript);
    setSpeechListening(false);
  };

  recognition.onresult = handleSpeechRecognitionResult;

  return (
    <>
      <div className="container-fluid h-100">
        <div className="row m-2">
          <div className="col">
            <h1>
              <img src={logo} style={{ width: "100px" }} /> What's that
              definition!?
            </h1>
          </div>
        </div>
        {getAvailableDefinitions().length === 0 ? (
          <div
            className="row m-2 justify-content-center align-items-center"
            style={{ minHeight: "300px" }}
          >
            <div className="col p-2 bg-light">
              <h3>Great work! All Definitions Answered!</h3>
              <button className="btn btn-primary m-2" onClick={handleReplay}>
                Play Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="row m-2 justify-content-center align-items-center"
              style={{ minHeight: "100px" }}
            >
              <div className="col p-2 bg-light">
                <h3>{definition.name}</h3>
              </div>
            </div>
            <div className="row m-2 d-flex justify-content-center">
              <div className="col-8">
                <textarea
                  className="form-control"
                  placeholder="Type your answer... Pressing [Enter] submits your answer. Note: punctuation and common 'functors' (e.g. 'as', 'the', 'that') are ignored when scoring your answer - i.e. only the 'blank words' are scored (+5 merit points per word)"
                  onKeyPress={(e) => {
                    handleKeyPress(e);
                  }}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setAnswerSubmitted(false);
                  }}
                  value={answer}
                ></textarea>
              </div>
            </div>
            <div className="row m-2">
              <div className="col">
                <button className="btn btn-primary m-2" onClick={handleNext}>
                  Next Random Definition
                </button>
                <button
                  disabled={
                    answer ? (definitionHintState === -1 ? true : false) : true
                  }
                  className="btn btn-success m-2"
                  onClick={handleSubmitAnswer}
                >
                  Submit Answer
                </button>
                <button
                  disabled={Math.abs(definitionHintState) === 1}
                  className="btn btn-warning m-2"
                  style={{ width: "200px" }}
                  onClick={handleHint}
                >
                  {hintButtonText}
                </button>
                <button
                  disabled={
                    definition.name
                      ? definitionHintState === -1
                        ? true
                        : false
                      : true
                  }
                  className="btn btn-danger m-2"
                  onClick={handleReveal}
                >
                  Reveal
                </button>
                <button
                  disabled={
                    definition.name
                      ? definitionHintState === -1
                        ? true
                        : false
                      : true
                  }
                  className="btn btn-info m-2"
                  onClick={handleListen}
                >
                  🎤 Speak
                </button>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <b>Definitions left: {getAvailableDefinitions().length}</b>
              </div>
            </div>
            <div className="row m-2">
              <div className="col">
                <PowerLevelBar powerLevel={powerLevel} />
              </div>
            </div>
            <div
              className="row mt-3 m-2 bg-light justify-content-center align-items-center"
              style={{ minHeight: "100px" }}
            >
              <div className="col p-2">
                <div style={{ fontSize: "24px", fontFamily: "Lucida Console" }}>
                  {showDefinition()}
                </div>
              </div>
            </div>
            <div
              className="row justify-content-center align-items-center"
              style={{ height: "100px" }}
            >
              <div className="col">
                {answerSubmitted ? <h1>{scoreEncouragement()}</h1> : <></>}
              </div>
            </div>{" "}
          </>
        )}
      </div>
      <ToastContainer
        position="bottom-left"
        autoClose={1000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        limit={2}
        transition={Zoom}
      />
    </>
  );
}

export default Definitions;
