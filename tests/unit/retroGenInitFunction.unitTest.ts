import { Context } from "aws-lambda";
import { retroGenInit } from "../../src/functions/retroGenInit";
import { SQService } from "../../src/services/SQService";
import { StreamService } from "../../src/services/StreamService";

describe("retroGenInit  Function", () => {
  const ctx = "" as unknown as Context;
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  describe("with good event", () => {
    it("should invoke SQS service with correct params", async () => {
      const sendMessage = jest.fn().mockResolvedValue("Success");
      SQService.prototype.sendMessage = sendMessage;
      StreamService.getVisitsStream = jest
        .fn()
        .mockReturnValue([{ test: "thing" }]);
      await retroGenInit({}, ctx, () => {
        return;
      });
      expect(sendMessage).toHaveBeenCalledWith(
        JSON.stringify({ test: "thing" })
      );
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("when SQService throws error", () => {
    it("should throw error", async () => {
      StreamService.getVisitsStream = jest.fn().mockReturnValue([{}]);
      const myError = new Error("It Broke!");
      SQService.prototype.sendMessage = jest.fn().mockRejectedValue(myError);

      expect.assertions(1);
      await expect(retroGenInit({}, ctx, () => {})).rejects.toThrow(
        myError.message
      );
    });
  });
});
