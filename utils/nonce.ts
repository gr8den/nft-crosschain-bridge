import { BigNumber } from "@ethersproject/bignumber";

export function generateNonce() {
  return BigNumber.from( Math.round(Math.random()*1e18).toString() );
}
