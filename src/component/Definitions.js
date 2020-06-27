import React, { useState, useEffect } from "react";
import axios from "axios";
import stringSimilarity from "string-similarity";

import stopwords from "../data/stopwords";
import definitions from "../data/definitions";

import logo from "../book-open-flat.png";

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
  let words = definition.match(/\b(\w+)\b/g);
  let wordProps = [];
  let stopWordIndex = [];
  let wordMaskIndex = [];
  let wordIndex;
  for (wordIndex in words) {
    wordProps.push({
      wordIndex: wordIndex,
      word: words[wordIndex],
      stopWord: stopwords.indexOf(words[wordIndex]) !== -1,
      maskWord: stopwords.indexOf(words[wordIndex]) === -1,
    });
  }
  let scoreWords = [];
  for (let i = 0; i < wordProps.length; i++) {
    if (!wordProps[i]["stopWord"]) {
      scoreWords.push(wordProps[i]["word"]);
    }
  }
  return [wordProps, scoreWords];
};

const getDefinitionWithProps = (definition) => {
  let definitionWithProps = definition;
  let [wordProps, scoreWords] = maskWordList(definition.definition);
  definitionWithProps["wordProps"] = wordProps;
  definitionWithProps["scoreWords"] = scoreWords;
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

  const [hintButtonText, setHintButtonText] = useState("Hint");
  const [answerScore, setAnswerScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [powerLevel, setPowerLevel] = useState(100);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  useEffect(() => {
    const powerLevelTimer = setTimeout(() => {
      setPowerLevelWithRange(powerLevel - 0.25);
    }, 250);
    return () => clearTimeout(powerLevelTimer);
  });

  const setPowerLevelWithRange = (powerLevel) => {
    setPowerLevel(Math.min(100, Math.max(0, powerLevel)));
  };

  const handleNext = () => {
    // pick a different defintion
    let currentDefinitionIndex = definitionArray.indexOf(definition);
    let nextDefinitionIndex = Math.floor(Math.random() * definitions.length);
    let i = 0;
    do {
      nextDefinitionIndex = Math.floor(Math.random() * definitions.length);
      i++;
    } while (nextDefinitionIndex === currentDefinitionIndex && i < 5);
    setDefinition(getDefinitionWithProps(definitions[nextDefinitionIndex]));

    // if the answer has already been revealed
    if (definitionHintState === -1) {
      setPowerLevelWithRange(powerLevel - 5);
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
    setHintButtonText("Hint Again");

    // update score progress
    setPowerLevelWithRange(powerLevel - 5);
  };

  const handleReveal = () => {
    setDefinitionHintState(-1);
    setPowerLevelWithRange(powerLevel - 5);
  };

  const handleSubmitAnswer = () => {
    let checkAnswerScore = 0;
    if (definition.definition ? (answer ? true : false) : false) {
      let modifiedDefinition = definition.definition
        .match(/\b(\w+)\b/g)
        .join(" ")
        .replace(/[^\w\s]|_/g, "")
        .toLowerCase();
      let modifiedAnswer = answer
        .match(/\b(\w+)\b/g)
        .join(" ")
        .replace(/[^\w\s]|_/g, "")
        .toLowerCase();
      checkAnswerScore = stringSimilarity.compareTwoStrings(
        modifiedDefinition,
        modifiedAnswer
      );
    } else {
      checkAnswerScore = 0;
    }
    if (checkAnswerScore < 100) {
      setDefinitionHintState(1);
    }
    setAnswerScore(checkAnswerScore);
    setAnswerSubmitted(true);
    if (checkAnswerScore >= 1) {
      setPowerLevelWithRange(powerLevel + 30);
      setDefinitionHintState(-1);
    } else {
      setPowerLevelWithRange(powerLevel - 10);
    }
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
      let displayWord;
      if (wordProps.maskWord) {
        displayWord = "_".repeat(wordProps.word.length) + " ";
        return (
          <span
            onClick={(e) => handleUnmaskWord(wordProps.wordIndex)}
            style={{ fontSize: "24px", fontFamily: "Lucida Console" }}
          >
            {displayWord}
          </span>
        );
      } else {
        return <>{wordProps.word} </>;
      }
    });
  };

  const handleUnmaskWord = (wordIndex) => {
    let wordProps = definition.wordProps.slice();
    wordProps[wordIndex]["maskWord"] = false;
    setDefinition({ ...definition, wordProps: wordProps });
    setPowerLevelWithRange(powerLevel - 5);
  };

  return (
    <div className="container-fluid h-100">
      <div className="row m-2">
        <div className="col">
          <h1>
            <img src={logo} style={{ width: "100px" }} /> What's that
            definition!?
          </h1>
        </div>
      </div>
      <div
        className="row m-2 justify-content-center align-items-center"
        style={{ height: "100px" }}
      >
        <div className="col p-2 bg-light">
          <h3>{definition.name}</h3>
        </div>
      </div>
      <div className="row m-2 d-flex justify-content-center">
        <div className="col-8">
          <textarea
            className="form-control"
            placeholder="Your answer..."
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
            disabled={
              definition.name
                ? definitionHintState === -1
                  ? true
                  : false
                : true
            }
            className="btn btn-warning m-2"
            style={{ width: "120px" }}
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
      </div>
    </div>
  );
}

export default Definitions;
