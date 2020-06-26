import React, { useState, useEffect } from "react";
import axios from "axios";
import stringSimilarity from "string-similarity";

import stopwords from "../data/stopwords";
import definitions from "../data/definitions";

function Definitions(props) {
  const [definitionArray, setDefinitionArray] = useState(definitions);
  const [definition, setDefinition] = useState(
    definitionArray[Math.floor(Math.random() * definitionArray.length)]
  );
  const [definitionState, setDefinitionState] = useState(0);
  const [hintButtonText, setHintButtonText] = useState("Hint");
  const [answerScore, setAnswerScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [powerLevel, setPowerLevel] = useState(0);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  useEffect(() => {
    getDefintitions();
  }, []);

  const getDefintitions = async () => {
    // let url = "http://192.168.1.20:8529/_db/_system/api/get/all/objects";
    // let result = await axios.get(url);
    setDefinitionArray(definitions);
  };

  const handleNext = async () => {
    let currentDefinitionIndex = definitionArray.indexOf(definition);
    let nextDefinitionIndex = Math.floor(Math.random() * definitions.length);
    let i = 0;
    do {
      nextDefinitionIndex = Math.floor(Math.random() * definitions.length);
      i++;
    } while (nextDefinitionIndex !== currentDefinitionIndex && i < 5);
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
    setAnswerScore(checkAnswerScore);
    setAnswerSubmitted(true);
    if (checkAnswerScore >= 1) {
      setDefinitionState(-1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.charCode === 13) {
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
        return words.join(" ");
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
      <div className="row mt-5">
        <div className="col">
          <h1>What's that defintion!?</h1>
        </div>
      </div>
      <div
        className="row justify-content-center align-items-center"
        style={{ height: "100px" }}
      >
        <div className="col">
          <h3>{definition.name}</h3>
        </div>
      </div>
      <div className="row d-flex justify-content-center m-3">
        <div className="col-8">
          <textarea
            className="form-control"
            placeholder="Your answer.."
            onChange={(e) => {
              setAnswer(e.target.value);
              setAnswerSubmitted(false);
            }}
            value={answer}
          ></textarea>
        </div>
      </div>
      <div className="row">
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
      <div className="row">
        <div className="col">
          <mark>(Scoring mechanism under development!)</mark>
        </div>
      </div>
      <div
        className="row m-5 justify-content-center align-items-center"
        style={{ height: "100px" }}
      >
        <div className="col">
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

/*

      <div className="row">
        {true ? (
          <></>
        ) : (
          <table className="table table-sm text-left">
            <tbody>
              {defns.map((def) => (
                <tr key={def.name}>
                  <td>{def.name}</td>
                  <td>{def.definition}</td>
                  <td>{maskDefinition(def.definition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      */
