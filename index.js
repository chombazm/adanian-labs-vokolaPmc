// import ReactDOM from "react-dom";
// import { BrowserRouter } from "react-router-dom";
// import App from "./src/App";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./src/App";
import { Provider } from "react-redux";
import { store } from "./src/store";
import { SnackbarProvider } from "notistack";

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <SnackbarProvider maxSnack={3} autoHideDuration={2000}>
        <App />
      </SnackbarProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
