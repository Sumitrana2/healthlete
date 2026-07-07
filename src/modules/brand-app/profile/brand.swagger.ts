import { registry } from "../../../config/swagger";
import { successResponse, errorResponse } from "../../../utils/swaggerSchemas";
import { addCampaignFocusSchema, addCompanySchema, companyResponse, completeOnboardingSchema, mediaLanguagePreferencesSchema, profileSchema } from "./brand.schema";

registry.registerPath({
  method: "get",
  path: "/brand/profile/me",
  tags: ["Brand Profile"],
  summary: "Get logged-in brand profile",
  description: "Returns the profile of the authenticated brand.",
  responses: {
    200: {
      description: "Profile fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(profileSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/profile/company",
  tags: ["Brand Profile"],
  summary: "Add company to brand",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: addCompanySchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Company linked successfully",
      content: {
        "application/json": {
          schema: successResponse(companyResponse),
        },
      },
    },

    404: {
      description: "Brand or Industry not found",
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
  method: "post",
  path: "/brand/profile/campaign-focus",
  tags: ["Brand Profile"],
  summary: "Add campaign focus",

  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: addCampaignFocusSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Campaign focus saved successfully",
      content: {
        "application/json": {
          schema: successResponse(
            addCampaignFocusSchema
          ),
        },
      },
    },

    400: {
      description: "Invalid health condition or campaign objective ids",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },

    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },

    404: {
      description: "Brand not found",
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
  method: "post",
  path: "/brand/profile/media-language-preferences",
  tags: ["Brand Profile"],
  summary: "Save media & language preferences",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: mediaLanguagePreferencesSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Media & language preferences saved successfully",
      content: {
        "application/json": {
          schema: successResponse(mediaLanguagePreferencesSchema),
        },
      },
    },

    400: {
      description: "Invalid preferred channel or language ids",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },

    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },

    404: {
      description: "Brand not found",
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
  method: "post",
  path: "/brand/profile/complete-onboarding",
  tags: ["Brand Profile"],
  summary: "Complete brand onboarding",

  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: completeOnboardingSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Onboarding completed successfully",
      content: {
        "application/json": {
          schema: successResponse(
            completeOnboardingSchema
          ),
        },
      },
    },

    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },

    404: {
      description: "Brand not found",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
  },
});