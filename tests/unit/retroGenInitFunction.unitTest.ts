import mockContext = require("aws-lambda-mock-context");
import {SQService} from "../../src/services/SQService";
import {StreamService} from "../../src/services/StreamService";
import {retroGenInit} from "../../src/functions/retroGenInit";

describe("retroGenInit  Function",  () => {
  const ctx = mockContext();
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModuleRegistry();
  });
  describe("with good event", () => {
    it("should invoke SQS service with correct params", async () => {
      const sendMessage = jest.fn().mockResolvedValue("Success");
      SQService.prototype.sendMessage = sendMessage;
      StreamService.getVisitsStream = jest.fn().mockReturnValue([{test: "thing"}]);
      await retroGenInit({}, ctx, () => { return; });
      expect(sendMessage).toHaveBeenCalledWith(JSON.stringify({test: "thing"}));
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("when SQService throws error", () => {
    it("should return undefined", async () => {
      StreamService.getVisitsStream = jest.fn().mockReturnValue([{}]);
      const myError = new Error("It Broke!");
      SQService.prototype.sendMessage = jest.fn().mockRejectedValue(myError);

      expect.assertions(1);
      try {
        const result = await retroGenInit({}, ctx, () => { return; });
        expect(result).toBe(undefined);
      } catch (e) {
        // Doesn't currently throw error. Probably should in a future revision
        // expect(e.message).toEqual(myError.message);
      }
    });
  });
});
