const User = require("../models/User");

const getProfile = async (req, res, next) => {
  try {
    // Find user and populate the hardware references to get their brand/model details
    const user = await User.findById(req.user.id)
      .populate("my_pc.cpuId")
      .populate("my_pc.gpuId")
      .select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateSpecs = async (req, res, next) => {
  try {
    const { cpuId, gpuId, ram_gb } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id || req.userId,
      {
        myPc: { cpuId, gpuId, ramGb: ram_gb },
        my_pc: {
          cpuId,
          gpuId,
          ram_gb,
        },
      },
      { new: true, runValidators: true },
    )
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
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfile, updateSpecs };
