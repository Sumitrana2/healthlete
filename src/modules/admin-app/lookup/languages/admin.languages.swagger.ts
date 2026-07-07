import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";
import {
  createLanguageSchema,
  languageSchema,
  updateLanguageSchema,
} from "./admin.languages.schema";

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

registry.registerPath({
  method: "patch",
  path: "/admin/lookup/languages/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Update athlete language",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Language ID"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateLanguageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Language updated successfully",
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
    404: {
      description: "Language not found",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    409: {
      description: "Language name or code already exists",
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
  method: "delete",
  path: "/admin/lookup/languages/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Delete athlete language",

  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },

  responses: {
    200: {
      description: "Language deleted successfully",
      content: {
        "application/json": {
          schema: successResponse(languageSchema),
        },
      },
    },

    404: {
      description: "Language not found",
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