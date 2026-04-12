import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Welcome } from "./components/Welcome";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { AppHome } from "./components/AppHome";
import { Services } from "./components/Services";
import { Pricing } from "./components/Pricing";
import { Booking } from "./components/Booking";
import { Profile } from "./components/Profile";
import { Reviews } from "./components/Reviews";
import { Products } from "./components/Products";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Welcome },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "home", Component: AppHome },
      { path: "services", Component: Services },
      { path: "pricing", Component: Pricing },
      { path: "booking", Component: Booking },
      { path: "profile", Component: Profile },
      { path: "reviews", Component: Reviews },
      { path: "products", Component: Products },
      { path: "*", Component: NotFound },
    ],
  },
]);