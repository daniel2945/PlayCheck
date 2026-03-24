const User = require("../models/User");

const updateSpecs = async (req, res, next) => {
  try {
    // Correctly expect cpuId, gpuId, and ramGb from the body
    const { cpuId, gpuId, ramGb } = req.body;

    // Validate that all required fields are present
    if (!cpuId || !gpuId || !ramGb) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields: cpuId, gpuId, ramGb" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      // Only use req.user.id, which is reliably set by the verifyToken middleware
      req.user.id,
      {
        // Update only the 'myPc' object, which is defined in the schema
        myPc: { cpuId, gpuId, ramGb },
      },
      { new: true, runValidators: true },
    )
      // Correctly populate the fields within the 'myPc' object
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Specs updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("SPECS UPDATE ERROR:", error);
    next(error);
  }
};

module.exports = { updateSpecs };
