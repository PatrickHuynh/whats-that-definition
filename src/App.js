import React from "react";
import logo from "./logo.svg";
import "./App.css";

import Definitions from "./component/Definitions";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="App container-fluid">
      <Definitions></Definitions>
    </div>
  );
}

export default App;
