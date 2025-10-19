const QuestionModel = require("../modal/Question.model"); // Make sure this model exists and is exported
const { createResponse } = require("../utils/response");
const { convertFieldsToAggregateObject } = require("../helper/index");
const { statusSearch, search } = require("../helper/search"); // Assuming search is defined here
const { ObjectId } = require("mongoose").Types; // Import ObjectId for query construction

exports.QuestionList = async (params) => {
  try {
    const {
      _id = "",
      status,
      keyword,
      rating, // Retained for compatibility, even if not in the Question Schema
      offset = 0,
      limit = 10,
      searchValue = "",
      selectValue = "questionText,type,difficulty,category,tags,isPublished,createdBy",
      sortQuery = "-createdAt",
    } = params;

    const select = selectValue && selectValue.replaceAll(",", " ");
    let selectProjectParams = convertFieldsToAggregateObject(select, " ");

    let query = { deletedAt: null };
    let optionalQuery = { deletedAt: null }; // Renamed from deleteAt

    if (rating) optionalQuery.rating = { $gte: parseInt(params.rating) };

    // Assuming status refers to a status field on the Question model
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
          // Searching primarily on questionText
          questionText: { $regex: keyword.split(" ")[0], $options: "i" },
        });
      }
    }

    const myAggregate = QuestionModel.aggregate([
      { $match: query },
      // Lookup related data (e.g., category, createdBy user) here if necessary
      // { $lookup: ... }
      {
        $project: {
          ...selectProjectParams,
        },
      },
      { $match: optionalQuery },
    ]);

    const result = await QuestionModel.aggregatePaginate(myAggregate, {
      offset: offset,
      limit: limit,
      sort: sortQuery,
    });

    return createResponse({
      status: 200,
      success: true,
      message: "Question list fetched successfully",
      data: {
        list: result?.docs || [],
        totalDocs: result?.totalDocs || 0,
      },
    });
  } catch (error) {
    console.error("Question List Error:", error);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

/**
 * Service function to create a new Question document.
 * @param {QuestionParams} params - The data payload for creating the question.
 * @returns {Promise<Object>} The standardized response object.
 */
exports.QuestionAdd = async (params) => {
  try {
    // 1. Create a new Question instance by spreading all incoming parameters
    // The Mongoose model will automatically validate and filter fields based on the schema.
    const question = new QuestionModel({
      ...params,
      // 2. Set the createdBy field using the authenticated user's ID
      createdBy: params.authUser ? params.authUser._id : null,
    });

    // 3. Save the new document to the database
    const savedQuestion = await question.save();

    // 4. Return success response
    return createResponse({
      status: 201,
      success: true,
      message: "Question created successfully",
      data: savedQuestion,
    });
  } catch (err) {
    // Handle validation errors, database connection issues, etc.
    console.error("Question Add Error:", err.message);

    // Check for specific Mongoose errors if needed (e.g., validation, duplicate key)
    let status = 500;
    let message = `Server Error: ${err.message}`;

    if (err.name === "ValidationError") {
      status = 400;
      message = `Validation Error: ${Object.values(err.errors)
        .map((e) => e.message)
        .join(", ")}`;
    } else if (err.code === 11000) {
      // Duplicate key error
      status = 409;
      message = `Duplicate entry: A question with this text already exists.`;
    }

    return createResponse({
      status: status,
      success: false,
      message: message,
    });
  }
};

exports.QuestionEdit = async (params) => {
  const { _id, authUser, ...updateData } = params;

  if (!_id) {
    return createResponse({ status: 400, success: false, message: "Question ID is required for editing." });
  }

  try {
    // Ensure the deletedAt field is not set
    const updatedQuestion = await QuestionModel.findOneAndUpdate(
      { _id: new ObjectId(_id), deletedAt: null },
      // Use spread to apply all update fields
      { $set: { ...updateData } },
      { new: true, runValidators: true } // Return the updated document and run Mongoose validators
    );

    if (!updatedQuestion) {
      return createResponse({
        status: 404,
        success: false,
        message: "Question not found or already deleted.",
      });
    }

    return createResponse({
      status: 200,
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (err) {
    console.error("Question Edit Error:", err.message);
    let status = 500;
    let message = `Server Error: ${err.message}`;

    if (err.name === "ValidationError") {
      status = 400;
      message = `Validation Error: ${Object.values(err.errors)
        .map((e) => e.message)
        .join(", ")}`;
    }

    return createResponse({
      status: status,
      success: false,
      message: message,
    });
  }
};

/**
 * Service function to retrieve a single Question detail by ID.
 * @param {Object} params - Must contain _id.
 * @returns {Promise<Object>} The standardized response object.
 */
exports.QuestionDetail = async (params) => {
  const { _id } = params;

  if (!_id) {
    return createResponse({ status: 400, success: false, message: "Question ID is required." });
  }

  try {
    // Find the question, ensuring it is not soft-deleted
    const question = await QuestionModel.findOne({
      _id: new ObjectId(_id),
      deletedAt: null,
    }).lean(); // Use .lean() for faster read access

    if (!question) {
      return createResponse({
        status: 404,
        success: false,
        message: "Question not found.",
      });
    }

    return createResponse({
      status: 200,
      success: true,
      message: "Question details fetched successfully",
      data: question,
    });
  } catch (err) {
    console.error("Question Detail Error:", err.message);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${err.message}`,
    });
  }
};

/**
 * Service function to soft-delete one or more Question documents.
 * @param {Object} params - Must contain _id (string or array of strings).
 * @returns {Promise<Object>} The standardized response object.
 */
exports.QuestionRemoves = async (params) => {
  const { _id } = params;

  if (!_id || (Array.isArray(_id) && _id.length === 0)) {
    return createResponse({ status: 400, success: false, message: "At least one Question ID is required for deletion." });
  }

  try {
    // Convert single ID or array of IDs to an array of ObjectIds
    const ids = Array.isArray(_id) ? _id.map((id) => new ObjectId(id)) : [new ObjectId(_id)];

    // Soft delete: set deletedAt to the current date for the selected IDs
    const result = await QuestionModel.updateMany({ _id: { $in: ids }, deletedAt: null }, { $set: { deletedAt: Date.now() } });

    if (result.matchedCount === 0) {
      return createResponse({
        status: 404,
        success: false,
        message: "No active questions found with the provided IDs.",
      });
    }

    return createResponse({
      status: 200,
      success: true,
      message: `${result.modifiedCount} question(s) successfully soft-deleted.`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (err) {
    console.error("Question Removes Error:", err.message);
    return createResponse({
      status: 500,
      success: false,
      message: `Server Error: ${err.message}`,
    });
  }
};

exports.QuestionAns = async (params) => {
  const { _id, authUser } = params;

  if (!_id) {
    return createResponse({ status: 400, success: false, message: "Question ID is required for editing." });
  }

  try {
    // Ensure the deletedAt field is not set
    const updatedQuestion = await QuestionModel.findOneAndUpdate(
      { _id: new ObjectId(_id), deletedAt: null },
      // Use spread to apply all update fields
      { $set: { ...updateData } },
      { new: true, runValidators: true } // Return the updated document and run Mongoose validators
    );

    if (!updatedQuestion) {
      return createResponse({
        status: 404,
        success: false,
        message: "Question not found or already deleted.",
      });
    }

    return createResponse({
      status: 200,
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (err) {
    console.error("Question Edit Error:", err.message);
    let status = 500;
    let message = `Server Error: ${err.message}`;

    if (err.name === "ValidationError") {
      status = 400;
      message = `Validation Error: ${Object.values(err.errors)
        .map((e) => e.message)
        .join(", ")}`;
    }

    return createResponse({
      status: status,
      success: false,
      message: message,
    });
  }
};
