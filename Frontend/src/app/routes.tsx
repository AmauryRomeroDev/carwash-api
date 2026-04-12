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
import { Vehicles } from "./components/Vehicles";
import { NotFound } from "./components/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminStaff } from "./pages/admin/AdminStaff";
import { AdminInventory } from "./pages/admin/AdminInventory";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminServices } from "./pages/admin/AdminServices";
import { AdminComments } from "./pages/admin/AdminComments";

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
      { path: "vehicles", Component: Vehicles },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "staff", Component: AdminStaff },
      { path: "inventory", Component: AdminInventory },
      { path: "products", Component: AdminProducts },
      { path: "services", Component: AdminServices },
      { path: "comments", Component: AdminComments },
    ],
  },
]);