const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../modal/User.model");
const { createResponse } = require("../utils/response");
const { uploadBinaryFile } = require("../utils/upload");

const login = async (params) => {
  try {
    const { email, password } = params;

    const user = await userModel.findOne({ email, deletedAt: null });
    if (!user) {
      return createResponse({
        status: 401,
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return createResponse({
        status: 401,
        success: false,
        message: "password mis matched",
      });
    }
    console.log("login", user);
    const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    if (user.refreshToken.length >= 5) {
      user.refreshToken.shift(); // remove the oldest
    }

    user.refreshToken.push({
      token: refreshToken,
      createdAt: new Date(),
      device: params?.device || params?.userAgent || "unknown",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await user.save();

    return createResponse({
      status: 200,
      message: "Logged In",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
        },
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

const signUp = async (params) => {
  try {
    const { name, email, password, role = "user" } = params;

    const existingUser = await userModel.findOne({ email, deletedAt: null });
    if (existingUser) {
      return createResponse({
        status: 400,
        success: false,
        message: "User already exists.",
      });
    }

    if (params.image?.length > 0) {
      try {
        const up = await uploadBinaryFile({ file: params.image[0], folder: "user" });
        params.image = up;
      } catch (uploadErr) {
        return createResponse({
          status: 500,
          success: false,
          message: `Image upload failed: ${uploadErr.message}`,
        });
      }
    } else {
      delete params.image;
    }
    const newUser = await new userModel({ email, password, name, role, image: params.image, loginType: "local" }).save();
    const accessToken = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return createResponse({
      status: 201,
      message: "Sign-up Successfully",
      data: {
        user: {
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
        },
        token: accessToken,
      },
    });
  } catch (error) {
    console.log(error);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

const refreshAccessToken = async (params) => {
  try {
    const { refreshToken } = params; // or req.headers['x-refresh-token']

    if (!refreshToken) {
      return createResponse({
        status: 401,
        success: false,
        message: "Refresh token is required",
      });
    }

    // Decode and verify the token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return createResponse({
        status: 403,
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await userModel.findOne({ _id: decoded.userId, deletedAt: null });
    if (!user) {
      return createResponse({
        status: 404,
        success: false,
        message: "User not found",
      });
    }

    // Check if token exists in DB
    const storedToken = user.refreshToken.find((t) => t.token === refreshToken);

    if (!storedToken) {
      return createResponse({
        status: 403,
        success: false,
        message: "Refresh token not recognized",
      });
    }

    // Check if token expired
    if (storedToken.expiresAt && new Date() > storedToken.expiresAt) {
      // Optional: remove expired token from DB
      user.refreshToken = user.refreshToken.filter((t) => t.token !== refreshToken);
      await user.save();
      return createResponse({
        status: 403,
        success: false,
        message: "Refresh token expired",
      });
    }

    // Issue new access token
    const newAccessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // return res.status(200).json({
    //   message: "Access token refreshed",
    //   accessToken: newAccessToken,
    // });

    return createResponse({
      status: 200,
      success: "success",
      message: "Access token refreshed",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

module.exports = { login, signUp, refreshAccessToken };
