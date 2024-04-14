import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import store from "./../redux/store";
import router from "./Routes/Routes";
import "./index.css";

function App() {
  return (
    <>
      <Provider store={store}>
        <HelmetProvider>
          <RouterProvider router={router} />
        </HelmetProvider>
      </Provider>
    </>
  );
}

export default App;
