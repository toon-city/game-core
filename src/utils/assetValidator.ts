export function validateClotheJson(json: any): string[] {
  const errors: string[] = [];
  
  if (!json) {
    errors.push('JSON is null or undefined');
    return errors;
  }

  // Check required fields
  if (!json.frames || typeof json.frames !== 'object') {
    errors.push('Missing or invalid "frames" object');
  }

  if (!json.meta || typeof json.meta !== 'object') {
    errors.push('Missing or invalid "meta" object');
  } else {
    if (!json.meta.image) {
      errors.push('Missing "meta.image" field');
    }
  }

  // Check frames structure
  if (json.frames) {
    for (const [frameKey, frameData] of Object.entries(json.frames)) {
      if (!frameData || typeof frameData !== 'object') {
        errors.push(`Invalid frame data for "${frameKey}"`);
        continue;
      }

      const frame = frameData as any;
      if (!frame.frame || typeof frame.frame !== 'object') {
        errors.push(`Missing "frame" object in "${frameKey}"`);
      } else {
        const requiredFrameProps = ['x', 'y', 'w', 'h'];
        for (const prop of requiredFrameProps) {
          if (typeof frame.frame[prop] !== 'number') {
            errors.push(`Missing or invalid "${prop}" in frame "${frameKey}"`);
          }
        }
      }
    }
  }

  return errors;
}

export function validateFurnitureJson(json: any): string[] {
  const errors: string[] = [];
  
  if (!json) {
    errors.push('JSON is null or undefined');
    return errors;
  }

  // Check required fields (same as clothes for spritesheet format)
  if (!json.frames || typeof json.frames !== 'object') {
    errors.push('Missing or invalid "frames" object');
  }

  // Check for ground anchoring points (optional but recommended for furniture)
  if (json.frames) {
    let hasAnchorData = false;
    let invalidAnchorPoints = 0;
    
    for (const [frameKey, frameData] of Object.entries(json.frames)) {
      const frame = frameData as any;
      if (frame.points && Array.isArray(frame.points)) {
        hasAnchorData = true;
        
        // Validate anchor point structure (ground footprint)
        for (let i = 0; i < frame.points.length; i++) {
          const point = frame.points[i];
          if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            errors.push(`Invalid anchor point structure at index ${i} in frame "${frameKey}"`);
            invalidAnchorPoints++;
          }
        }
        
        // Validate minimum anchor points for proper ground footprint
        if (frame.points.length < 3) {
          errors.push(`Insufficient anchor points in frame "${frameKey}" - need at least 3 for proper ground footprint`);
        }
      }
    }
    
    if (!hasAnchorData) {
      // Warning rather than error - furniture can work without custom anchor points
      console.warn('No ground anchor points found in furniture JSON - will use rectangular bounding box for collision');
    } else if (invalidAnchorPoints > 0) {
      errors.push(`Found ${invalidAnchorPoints} invalid anchor points - check point coordinates`);
    }
  }

  return errors;
}

export function validateMapJson(json: any): string[] {
  const errors: string[] = [];
  
  if (!json) {
    errors.push('JSON is null or undefined');
    return errors;
  }

  if (!Array.isArray(json)) {
    errors.push('Map JSON should be an array of furniture objects');
    return errors;
  }

  for (let i = 0; i < json.length; i++) {
    const item = json[i];
    if (!item || typeof item !== 'object') {
      errors.push(`Invalid furniture object at index ${i}`);
      continue;
    }

    // Check required fields for furniture placement
    const requiredFields = ['SID', 'SOID', 'STYPE', 'SURL', 'PXP', 'PYP', 'PR'];
    for (const field of requiredFields) {
      if (item[field] === undefined || item[field] === null) {
        errors.push(`Missing required field "${field}" in furniture at index ${i}`);
      }
    }

    // Validate types
    if (typeof item.STYPE !== 'number') {
      errors.push(`Invalid STYPE (should be number) in furniture at index ${i}`);
    }
    
    if (typeof item.PXP !== 'number' || typeof item.PYP !== 'number') {
      errors.push(`Invalid position (PXP/PYP should be numbers) in furniture at index ${i}`);
    }
    
    if (typeof item.PR !== 'number') {
      errors.push(`Invalid rotation (PR should be number) in furniture at index ${i}`);
    }
  }

  return errors;
}

/**
 * Validate asset file and return validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAssetFile(filename: string, json: any): ValidationResult {
  let errors: string[] = [];
  const warnings: string[] = [];

  try {
    if (filename.includes('/clothes/')) {
      errors = validateClotheJson(json);
      
      // Additional warnings for clothes
      if (json && !json.position) {
        warnings.push('No "position" object found - clothes may not align properly');
      }
    } else if (filename.includes('/furnitures/')) {
      errors = validateFurnitureJson(json);
    } else if (filename.includes('map_') || filename.includes('.json')) {
      errors = validateMapJson(json);
    } else {
      warnings.push('Unknown asset type - basic validation only');
      if (!json || typeof json !== 'object') {
        errors.push('Invalid JSON structure');
      }
    }
  } catch (error) {
    errors.push(`Validation failed: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Batch validate multiple asset files
 */
export function validateAssetsDirectory(assets: { filename: string; json: any }[]): {
  valid: boolean;
  results: { filename: string; result: ValidationResult }[];
} {
  const results = assets.map(asset => ({
    filename: asset.filename,
    result: validateAssetFile(asset.filename, asset.json)
  }));

  const allValid = results.every(r => r.result.valid);

  return { valid: allValid, results };
}