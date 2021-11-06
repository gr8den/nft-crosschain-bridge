import { assert } from "chai";
import { generateNonce } from "../utils/nonce";

it('should generate 2 unique nonces 100 times', () => {
  for(let i = 0; i < 100; i++) {
    assert( !generateNonce().eq(generateNonce()) );
  }
});
