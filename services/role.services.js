const RoleModel = require("../modal/Role.model"); // Make sure this model exists and is exported
const { createResponse } = require("../utils/response");
const { convertFieldsToAggregateObject, aggregateFileConcat } = require("../helper/index");
const { statusSearch } = require("../helper/search");
const { deleteFile, uploadBinaryFile } = require("../utils/upload");

exports.roleList = async (params) => {
  try {
    const { _id = "", status, keyword, offset = 0, limit = 10, searchValue = "", selectValue = "role,status", sortQuery = "-createdAt" } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    let selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    let optionalQuery = { deleteAt: null };

    if (status) query.status = statusSearch(status);

    if (Array.isArray(_id) && _id.length > 0) {
      let ids = _id.map((el) => new ObjectId(el));
      query["_id"] = { $in: ids };
    } else if (_id) query["_id"] = new ObjectId(_id);

    if (keyword) {
      const searchQuery = searchValue ? searchValue.split(",") : select.split(" ");
      optionalQuery.$or = search(searchQuery, keyword);
      if (keyword.includes(" ")) {
        optionalQuery.$or.push({
          $and: [{ name: { $regex: keyword.split(" ")[0], $options: "i" } }],
        });
      }
    }

    const myAggregate = RoleModel.aggregate([
      { $match: query },
      //   {
      //     $lookup: {
      //       from: "reviews",
      //       let: { user: "$_id" },
      //       pipeline: [
      //         { $match: { $expr: { $and: [{ $eq: ["$deletedAt", null] }, { $eq: ["$vendorId", "$$user"] }] } } },
      //         { $group: { _id: "$vendorId", averageRating: { $avg: "$rating" } } },
      //         { $project: { _id: 1, averageRating: 1 } },
      //       ],
      //       as: "review",
      //     },
      //   },
      //   concatArrayFile("portfolioImage"),
      //   { $unwind: { path: "$review", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          ...selectProjectParams,
          //  rating: "$review.averageRating"
        },
      },
      { $match: optionalQuery },
    ]);

    const result = await RoleModel.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return createResponse({
      status: 200,
      success: true,
      message: "Role list fetched successfully",
      data: {
        list: result?.docs || [],
      },
    });
  } catch (error) {
    console.error("Role Error:", error);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

exports.roleAdd = async (params) => {
  try {
    // console.log("params data", params);
    const { role } = params;
    const checkData = await RoleModel.findOne({ role, deleteAt: null });
    if (checkData) {
      return createResponse({
        status: 403,
        success: false,
        message: "Role already existed",
      });
    }
    params.code = params.code = role.replace(/W/g, "_").toUpperCase();
    const data = await new RoleModel({
      ...params,
      createdBy: params.authUser ? params.authUser._id : null,
    });

    // console.log()
    // console.log(user)
    const savedRole = await data.save();

    return createResponse({
      status: 201,
      success: true,
      message: "Role created successfully",
      data: savedRole,
    });
  } catch (err) {
    console.error("Role Add Error:", err.message);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${err.message}`,
    });
  }
};

exports.userEdit = () => {
  params.user = {
    _id: "123",
    email: "user@gmail.com",
    role: "admin",
  };
  try {
    return createResponse({
      status: 200,
      message: "User Updated",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.log("User Edit Error", err.msg);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${err.msg}`,
    });
  }
};
