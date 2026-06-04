import { useContext } from "react";
import { CartCtx } from "./cartStore.js";

export const useCart = () => useContext(CartCtx);
