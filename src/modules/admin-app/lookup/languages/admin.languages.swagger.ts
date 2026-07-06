import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";

const languageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
const createLanguageSchema = z.object({
  name: z.string().trim().min(2).max(100).describe("Language name"),

  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .describe("Language code (e.g. EN, HI, FR)"),
});

const ListSchema = z.object({
  item: z.array(languageSchema),
  ...paginationResponse.shape,
});

registry.registerPath({
  method: "post",
  path: "/admin/lookup/languages",
  tags: ["Admin Lookup Data"],
  summary: "Create athlete language",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createLanguageSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Language created successfully",
      content: {
        "application/json": {
          schema: successResponse(languageSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    409: {
      description: "Language already exists",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/languages",
  tags: ["Admin Lookup Data"],
  summary: "Get all active athlete languages",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by name"),
      isActive: z
        .enum(["true", "false"])
        .optional()
        .describe("Filter by status"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Languages fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(ListSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});
