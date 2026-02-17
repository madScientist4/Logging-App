const SwaggerParser = require('swagger-parser');
const OpenAPIRequestValidator = require('openapi-request-validator').default;
const { log, LogLevel } = require('../utils/logger');

// Cache for parsed Swagger specifications
const specCache = new Map();

/**
 * Clear the Swagger specification cache
 * Used when configuration changes to force reloading of specs
 */
function clearSpecCache() {
  const cacheSize = specCache.size;
  specCache.clear();
  log(LogLevel.INFO, 'Swagger specification cache cleared', {
    event: 'spec_cache_clear',
    cacheSize
  });
}

/**
 * Load and parse a Swagger/OpenAPI specification with caching
 * @param {string} specUrl - URL or path to the Swagger specification
 * @returns {Promise<Object>} Parsed OpenAPI specification object
 */
async function loadSwaggerSpec(specUrl) {
  // Check if spec is already cached
  if (specCache.has(specUrl)) {
    return specCache.get(specUrl);
  }

  try {
    // Parse and validate the Swagger specification
    const spec = await SwaggerParser.validate(specUrl);
    
    // Cache the parsed specification
    specCache.set(specUrl, spec);
    
    return spec;
  } catch (error) {
    throw new Error(`Failed to load Swagger specification from ${specUrl}: ${error.message}`);
  }
}

/**
 * Find the operation definition for a given endpoint and HTTP method
 * @param {Object} spec - Parsed OpenAPI specification
 * @param {string} endpoint - API endpoint path (e.g., "/api/users/123")
 * @param {string} method - HTTP method (e.g., "GET", "POST")
 * @returns {Object|null} Operation object or null if not found
 */
function findOperation(spec, endpoint, method) {
  if (!spec || !spec.paths) {
    return null;
  }

  const normalizedMethod = method.toLowerCase();
  
  // Try exact match first
  if (spec.paths[endpoint] && spec.paths[endpoint][normalizedMethod]) {
    return {
      path: endpoint,
      operation: spec.paths[endpoint][normalizedMethod],
      parameters: spec.paths[endpoint].parameters || []
    };
  }

  // Try matching with path parameters (e.g., /api/users/{id})
  for (const [pathPattern, pathItem] of Object.entries(spec.paths)) {
    if (matchPath(endpoint, pathPattern)) {
      if (pathItem[normalizedMethod]) {
        return {
          path: pathPattern,
          operation: pathItem[normalizedMethod],
          parameters: pathItem.parameters || []
        };
      }
    }
  }

  return null;
}

/**
 * Match an endpoint against a path pattern with parameters
 * @param {string} endpoint - Actual endpoint (e.g., "/api/users/123")
 * @param {string} pattern - Path pattern (e.g., "/api/users/{id}")
 * @returns {boolean} True if endpoint matches pattern
 */
function matchPath(endpoint, pattern) {
  // Convert OpenAPI path pattern to regex
  const regexPattern = pattern
    .replace(/\{[^}]+\}/g, '[^/]+') // Replace {param} with regex
    .replace(/\//g, '\\/');         // Escape slashes
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(endpoint);
}

/**
 * Validate an error request against Swagger specification
 * @param {Object} errorRequest - Error request object
 * @param {string} errorRequest.endpoint - API endpoint path
 * @param {string} errorRequest.method - HTTP method
 * @param {Object} errorRequest.payload - Request payload/body
 * @param {Object} config - Configuration object with swaggerSpecs
 * @returns {Promise<Object>} Validation result {isValid, errors}
 */
async function validateAgainstSwagger(errorRequest, config) {
  const { endpoint, method, payload } = errorRequest;
  const errors = [];

  try {
    // Find the appropriate Swagger spec based on endpoint pattern
    const specConfig = findSpecForEndpoint(endpoint, config.swaggerSpecs);
    
    if (!specConfig) {
      return {
        isValid: false,
        errors: ['API specification not found for endpoint']
      };
    }

    // Load the Swagger specification
    let spec;
    try {
      spec = await loadSwaggerSpec(specConfig.specUrl);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid API specification format: ${error.message}`]
      };
    }

    // Find the operation for this endpoint and method
    const operationInfo = findOperation(spec, endpoint, method);
    
    if (!operationInfo) {
      return {
        isValid: false,
        errors: [`Endpoint ${method} ${endpoint} not found in API specification`]
      };
    }

    // Validate the request body against the schema
    const { operation, parameters } = operationInfo;
    
    // Check if the operation expects a request body
    if (operation.requestBody) {
      const contentType = 'application/json';
      const schema = operation.requestBody.content?.[contentType]?.schema;
      
      if (schema) {
        const validationErrors = validateSchema(payload, schema, spec);
        errors.push(...validationErrors);
      }
    }

    // Validate required parameters
    const allParameters = [...parameters, ...(operation.parameters || [])];
    const paramErrors = validateParameters(allParameters, errorRequest);
    errors.push(...paramErrors);

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

/**
 * Find the Swagger spec configuration for a given endpoint
 * @param {string} endpoint - API endpoint path
 * @param {Array} swaggerSpecs - Array of spec configurations
 * @returns {Object|null} Spec configuration or null
 */
function findSpecForEndpoint(endpoint, swaggerSpecs) {
  if (!swaggerSpecs || !Array.isArray(swaggerSpecs)) {
    return null;
  }

  for (const specConfig of swaggerSpecs) {
    if (matchPattern(endpoint, specConfig.pattern)) {
      return specConfig;
    }
  }

  return null;
}

/**
 * Match an endpoint against a pattern
 * @param {string} endpoint - API endpoint
 * @param {string} pattern - Pattern with wildcards (e.g., "/api/users/*")
 * @returns {boolean} True if endpoint matches pattern
 */
function matchPattern(endpoint, pattern) {
  const regexPattern = pattern
    .replace(/\*/g, '.*')           // Replace * with .*
    .replace(/\//g, '\\/');         // Escape slashes
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(endpoint);
}

/**
 * Validate payload against JSON schema
 * @param {Object} payload - Request payload
 * @param {Object} schema - JSON schema
 * @param {Object} spec - Full OpenAPI spec (for resolving $ref)
 * @returns {Array<string>} Array of validation error messages
 */
function validateSchema(payload, schema, spec) {
  const errors = [];

  // Resolve $ref if present
  const resolvedSchema = resolveRef(schema, spec);

  // Check required fields
  if (resolvedSchema.required && Array.isArray(resolvedSchema.required)) {
    for (const field of resolvedSchema.required) {
      if (payload[field] === undefined || payload[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check field types and formats
  if (resolvedSchema.properties) {
    for (const [field, fieldSchema] of Object.entries(resolvedSchema.properties)) {
      if (payload[field] !== undefined) {
        const fieldErrors = validateField(field, payload[field], fieldSchema, spec);
        errors.push(...fieldErrors);
      }
    }
  }

  return errors;
}

/**
 * Validate a single field against its schema
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} schema - Field schema
 * @param {Object} spec - Full OpenAPI spec
 * @returns {Array<string>} Array of validation error messages
 */
function validateField(fieldName, value, schema, spec) {
  const errors = [];
  const resolvedSchema = resolveRef(schema, spec);

  // Type validation
  if (resolvedSchema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const expectedType = resolvedSchema.type;
    
    if (actualType === 'object' && expectedType === 'integer') {
      errors.push(`Field ${fieldName}: expected ${expectedType}, got ${actualType}`);
    } else if (actualType === 'object' && expectedType === 'number') {
      errors.push(`Field ${fieldName}: expected ${expectedType}, got ${actualType}`);
    } else if (actualType !== expectedType && !(actualType === 'number' && expectedType === 'integer')) {
      errors.push(`Field ${fieldName}: expected ${expectedType}, got ${actualType}`);
    }
  }

  // Enum validation
  if (resolvedSchema.enum && !resolvedSchema.enum.includes(value)) {
    errors.push(`Field ${fieldName}: value must be one of [${resolvedSchema.enum.join(', ')}]`);
  }

  // String format validation
  if (resolvedSchema.type === 'string' && resolvedSchema.format) {
    if (!validateFormat(value, resolvedSchema.format)) {
      errors.push(`Field ${fieldName}: invalid format, expected ${resolvedSchema.format}`);
    }
  }

  return errors;
}

/**
 * Validate string format
 * @param {string} value - String value
 * @param {string} format - Expected format (email, date, etc.)
 * @returns {boolean} True if valid
 */
function validateFormat(value, format) {
  switch (format) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'date':
      return !isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}$/.test(value);
    case 'date-time':
      return !isNaN(Date.parse(value));
    case 'uri':
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    default:
      return true; // Unknown formats pass
  }
}

/**
 * Resolve $ref references in schema
 * @param {Object} schema - Schema that may contain $ref
 * @param {Object} spec - Full OpenAPI spec
 * @returns {Object} Resolved schema
 */
function resolveRef(schema, spec) {
  if (!schema.$ref) {
    return schema;
  }

  // Parse $ref path (e.g., "#/components/schemas/User")
  const refPath = schema.$ref.replace(/^#\//, '').split('/');
  
  let resolved = spec;
  for (const part of refPath) {
    resolved = resolved[part];
    if (!resolved) {
      return schema; // Return original if ref can't be resolved
    }
  }

  return resolved;
}

/**
 * Validate required parameters
 * @param {Array} parameters - Array of parameter definitions
 * @param {Object} errorRequest - Error request object
 * @returns {Array<string>} Array of validation error messages
 */
function validateParameters(parameters, errorRequest) {
  const errors = [];

  for (const param of parameters) {
    if (param.required) {
      const paramIn = param.in; // query, header, path, cookie

      // For path parameters, we assume they're present if the endpoint matched
      // For query/header parameters, we would need additional data in errorRequest
      // For now, we skip validation of path parameters since endpoint matching implies they exist
      if (paramIn === 'query' || paramIn === 'header') {
        // Skip query and header validation for this implementation
        // In production, you'd check errorRequest.query and errorRequest.headers
        continue;
      }
    }
  }

  return errors;
}


module.exports = {
  loadSwaggerSpec,
  findOperation,
  validateAgainstSwagger,
  clearSpecCache
};
