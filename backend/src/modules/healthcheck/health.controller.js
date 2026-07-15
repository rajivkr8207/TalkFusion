import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";


export const healthCheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { server: "TinyCat Backend is live!!!" }, "TinyCat Backend is live!!!"))
})
