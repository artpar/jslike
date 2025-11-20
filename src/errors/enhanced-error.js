/**
 * Enhanced error classes for better developer experience
 */

// Simple Levenshtein distance for "did you mean" suggestions
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Find similar strings for suggestions
function findSimilar(target, candidates, maxDistance = 3) {
  const suggestions = [];

  for (const candidate of candidates) {
    const distance = levenshteinDistance(target.toLowerCase(), candidate.toLowerCase());
    if (distance <= maxDistance && distance > 0) {
      suggestions.push({ name: candidate, distance });
    }
  }

  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(s => s.name);
}

// Get available methods/properties on an object
function getAvailableMethods(obj) {
  if (obj === null || obj === undefined) return [];

  const methods = new Set();

  // Get own properties
  Object.getOwnPropertyNames(obj).forEach(name => {
    if (typeof obj[name] === 'function') {
      methods.add(name);
    }
  });

  // Get prototype methods
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach(name => {
      if (typeof proto[name] === 'function' && name !== 'constructor') {
        methods.add(name);
      }
    });
    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(methods).sort();
}

export class EnhancedTypeError extends TypeError {
  constructor(message, context = {}) {
    super(message);
    this.name = 'TypeError';
    this.objectName = context.objectName || 'object';
    this.methodName = context.methodName || 'method';
    this.objectValue = context.objectValue;
    this.availableMethods = context.availableMethods || [];
    this.suggestions = context.suggestions || [];
  }

  getFormattedMessage() {
    let formatted = this.message;

    // Add available methods
    if (this.availableMethods.length > 0) {
      const methodList = this.availableMethods.slice(0, 10).join(', ');
      const more = this.availableMethods.length > 10
        ? ` (and ${this.availableMethods.length - 10} more)`
        : '';
      formatted += `\n\nAvailable methods on '${this.objectName}': ${methodList}${more}`;
    }

    // Add suggestions
    if (this.suggestions.length > 0) {
      formatted += `\n\nDid you mean: ${this.suggestions.join(', ')}?`;
    }

    return formatted;
  }
}

export function createMethodNotFoundError(objectName, methodName, objectValue) {
  const availableMethods = getAvailableMethods(objectValue);
  const suggestions = findSimilar(methodName, availableMethods);

  const message = `TypeError when calling method '${methodName}' on object '${objectName}': ` +
    `Expected: function, Received: undefined`;

  return new EnhancedTypeError(message, {
    objectName,
    methodName,
    objectValue,
    availableMethods,
    suggestions
  });
}
