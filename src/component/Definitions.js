import React, { useState, useEffect } from "react";
import axios from "axios";
import stringSimilarity from "string-similarity";

import stopwords from "../data/stopwords";
import definitions from "../data/definitions";

import logo from "../book-open-flat.png";

function PowerLevelBar(props) {
  const calcWidths = () => {
    let widths = {
      0: Math.min(Math.max(0, props.powerLevel), 60),
      1: Math.min(Math.max(0, props.powerLevel - 60), 20),
      2: Math.min(Math.max(0, props.powerLevel - 80), 20),
    };
    return widths;
  };

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

/*

      <div
        className="progress-bar bg-danger"
        role="progressbar"
        style={{ width: `${calcWidths()[0]}%` }}
      ></div>
      <div
        className="progress-bar bg-warning"
        role="progressbar"
        style={{ width: `${calcWidths()[1]}%` }}
      ></div>
      <div
        className="progress-bar bg-success"
        role="progressbar"
        style={{ width: `${calcWidths()[2]}%` }}
      ></div>*/

function Definitions(props) {
  const [definitionArray, setDefinitionArray] = useState(definitions);
  const [definition, setDefinition] = useState(
    definitionArray[Math.floor(Math.random() * definitionArray.length)]
  );
  const [definitionState, setDefinitionState] = useState(0);
  const [hintButtonText, setHintButtonText] = useState("Hint");
  const [answerScore, setAnswerScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [powerLevel, setPowerLevel] = useState(100);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  useEffect(() => {
    getDefintitions();
    const powerLevelTimer = setTimeout(() => {
      setPowerLevelWithRange(powerLevel - 0.25);
    }, 250);
    return () => clearTimeout(powerLevelTimer);
  });

  const getDefintitions = async () => {
    // let url = "http://192.168.1.20:8529/_db/_system/api/get/all/objects";
    // let result = await axios.get(url);
    setDefinitionArray(definitions);
  };

  const setPowerLevelWithRange = (powerLevel) => {
    setPowerLevel(Math.min(100, Math.max(0, powerLevel)));
  };

  const handleNext = async () => {
    let currentDefinitionIndex = definitionArray.indexOf(definition);
    let nextDefinitionIndex = Math.floor(Math.random() * definitions.length);
    let i = 0;
    do {
      nextDefinitionIndex = Math.floor(Math.random() * definitions.length);
      i++;
    } while (nextDefinitionIndex !== currentDefinitionIndex && i < 5);
    if (!(definitionState === -1)) {
      setPowerLevelWithRange(powerLevel - 5);
    }
    setDefinition(definitions[Math.floor(Math.random() * definitions.length)]);
    setDefinitionState(0);
    setHintButtonText("Hint");
    setAnswer("");
    setAnswerScore(0);
    setAnswerSubmitted(false);
  };

  const handleHint = () => {
    setHintButtonText("Hint Again");
    setDefinitionState(Math.max(1, definitionState + 1));
    setPowerLevelWithRange(powerLevel - 5);
  };

  const handleReveal = () => {
    setDefinitionState(-1);
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
      setDefinitionState(Math.max(1, definitionState));
    }
    setAnswerScore(checkAnswerScore);
    setAnswerSubmitted(true);
    if (checkAnswerScore >= 1) {
      setPowerLevelWithRange(powerLevel + 30);
      setDefinitionState(-1);
    } else {
      setPowerLevelWithRange(powerLevel - 10);
    }
  };

  const handleKeyPress = (e) => {
    let keyCode = e.keyCode || e.which;
    if (keyCode === 13 || keyCode === 10) {
      e.preventDefault();
      if (!(definitionState === -1)) {
        handleSubmitAnswer();
      }
    }
    if (definitionState === -1) {
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

  const maskDefinition = (text, textState) => {
    try {
      if (textState >= 1) {
        let words = text.match(/\b(\w+)\b/g);
        let wordIndex;
        let hintWords = textState;
        for (wordIndex in words) {
          if (stopwords.indexOf(words[wordIndex]) === -1) {
            if (hintWords > 1) {
              hintWords -= 1;
            } else {
              words[wordIndex] = "_".repeat(words[wordIndex].length);
            }
          }
        }
        let textOutput = words.join(" ");
        return textOutput;
      } else if (textState === 0) {
        return "";
      } else if (textState === -1) {
        return text;
      } else {
        return "state not found";
      }
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row m-2">
        <div className="col">
          <h1>
            <img src={logo} style={{ width: "100px" }} /> What's that
            defintion!?
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
            disabled={answer ? (definitionState === -1 ? true : false) : true}
            className="btn btn-success m-2"
            onClick={handleSubmitAnswer}
          >
            Submit Answer
          </button>
          <button
            disabled={
              definition.name ? (definitionState === -1 ? true : false) : true
            }
            className="btn btn-warning m-2"
            style={{ width: "120px" }}
            onClick={handleHint}
          >
            {hintButtonText}
          </button>
          <button
            disabled={
              definition.name ? (definitionState === -1 ? true : false) : true
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
            {maskDefinition(definition.definition, definitionState)}
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
