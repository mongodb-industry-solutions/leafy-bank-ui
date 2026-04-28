import { makeBianProxy } from "../../../_bian-proxy.js";

export const dynamic = "force-dynamic";
export const POST = makeBianProxy({
    target: "accounts",
    path: "/CurrentAccountFulfillmentArrangement/CurrentAccountTransaction/Request",
});
