const RoleService = require("../services/role.services");

// Role Controller
const RoleList = async (req, res) => {
  try {
    const result = await RoleService.roleList({ ...req.authUser, ...req.body });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Role List Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};
const RoleAdd = async (req, res) => {
  try {
    const result = await RoleService.roleAdd({ ...req.authUser, ...req.body });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Role List Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

module.exports = { RoleAdd, RoleList };
