import {assert, setSuccess, test} from "./utils/test-runner.ts";

setSuccess("Nothing much to see here. Continue onto 012_reftypes.wat when you're ready!");

test("we're having fun", () => {
  assert(true === true, "what do you mean you're not having fun?!");
});
